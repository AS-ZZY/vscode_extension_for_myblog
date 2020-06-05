const vscode = require('vscode');
const fs = require('fs');
const axios = require("axios");

axios.defaults.baseURL = vscode.workspace.getConfiguration()
							.get('vscodePluginDemo.url');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let uploadPaper = vscode.commands.registerCommand('blog.uploadPaper',function (){
		checkToken(uploadPapers);
	});

	let uploadImg = vscode.commands.registerCommand('blog.uploadImg', function (){
		checkToken(uploadImgs);
	});

	const uploadPapers = (token) => {
		const content = vscode.window.activeTextEditor._documentData._lines;
		vscode.window.showInputBox({
			password: false,
			ignoreFocusOut: true,
			prompt:'标签，空格分界',
		})
		.then(msg => {
			let data = {
				tags: msg.split(" "),
				title: content[0].slice(2),
				time: new  Date().toLocaleDateString(),
				text: content.slice(1).join("\n"),
				paperId: "new",
				type: "paper",
				type2: "write"
			}
			let config = {
				headers: {"token": token}
			}
			return axios.post("save", data, config)
		})
		.then(res => {
			if(!res.data.login){
				vscode.window.showInformationMessage("没有登陆");
				vscode.workspace.getConfiguration()
					.update('vscodePluginDemo.token', "", true);
			}
			if(res.data.success){
				vscode.window.showInformationMessage("上传成功");
			}
			else{
				vscode.window.showInformationMessage("上传失败");
			}
		})
		.catch(() => {
			vscode.window.showInformationMessage("失败");
		})
	}

	const checkToken = (f) => {
		const token = vscode.workspace.getConfiguration()
						.get('vscodePluginDemo.token');
		if(token){
			f(token);
			return;
		}
		vscode.window.showInformationMessage("需要登陆");
		vscode.window.showInputBox({
			password: true,
			ignoreFocusOut: true,
			prompt:'密码',
		})
		.then(msg => {
			const username = vscode.workspace.getConfiguration()
							.get('vscodePluginDemo.username');
			return axios.post("login", { username: username,password: msg })
		})
		.then(res => {
			if(res.data.token){
				vscode.workspace.getConfiguration()
					.update('vscodePluginDemo.token', res.data.token, true);
				vscode.window.showInformationMessage("登陆成功");
				return;
			}
			vscode.window.showInformationMessage("密码错误");
		})
		.catch(() => {
			vscode.window.showInformationMessage("登陆失败");
		})
	}

	const uploadImgs = (token) => {
		vscode.window.showOpenDialog({ 
			canSelectFiles: true, 
			canSelectFolders:false, 
			canSelectMany: false, 
			defaultUri: vscode.Uri.file("/"), 
			openLabel:'确认'
		})
		.then(msg => {
			let imgPath = msg[0].path;
			let data = fs.readFileSync(imgPath);
			let t = imgPath.split(".");
			base64 = data.toString('base64')
			return axios.post("upload2",
				{data: base64,
				 filetype: t[t.length - 1]},
				{headers: { "token": token }})
		})
		.then(res => {
			let d = res.data;
			if(d.success){
				vscode.env.clipboard.writeText(d.name);
				vscode.window.showInformationMessage("上传成功");
			}
			else{
				vscode.window.showWarningMessage("重新登陆");
				vscode.workspace.getConfiguration()
					.update('vscodePluginDemo.token', "", true);
			}
		})
		.catch(error => {
			vscode.window.showErrorMessage("失败");
		})
	}

	context.subscriptions.push(uploadPaper);
	context.subscriptions.push(uploadImg);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}