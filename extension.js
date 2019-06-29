const vscode = require('vscode');
const nodemailer = require('nodemailer');
const zipDir = require('zip-dir');

const requestValue = message => vscode.window.showInputBox({ placeHolder: message });

const generateZipFile = path => {
  return new Promise((resolve, reject) => {
    zipDir(path, (err, buffer) => {
      if (err) return reject(err);
      return resolve(buffer);
    });
  });
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const configuration = vscode.workspace.getConfiguration('mati-submitter');

  const disposable = vscode.commands.registerCommand('mati-submitter.matiSubmit', async () => {
    if (!configuration.get('email')) {
      const email = await requestValue('Tu dirección de email');
      if (!email) return vscode.window.showErrorMessage('An email is required. It can be edited from settings.');
      configuration.update('email', email);
    }

    if (!configuration.get('dni')) {
      const dni = await requestValue('Tu número de DNI');
      if (!dni) return vscode.window.showErrorMessage('Your DNI number is required. It can be edited from settings.');
      configuration.update('dni', dni);
    }

    const homeworkId = await requestValue('Identificador del TP');
    if (!homeworkId) return;

    const password = await requestValue('Contrsaeña de tu mail');
    if (!password) return;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: configuration.get('email'),
        pass: password,
      },
    });

    try {
      const zipFileBuffer = await generateZipFile(vscode.workspace.rootPath);

      try {
        await transporter.sendMail({
          from: configuration.get('email'),
          to: 'tddentregas@gmail.com',
          subject: `${homeworkId} - ${configuration.get('dni')}`,
          attachments: [
            {
              filename: 'archivos.zip',
              content: zipFileBuffer,
            },
          ],
        });
        vscode.window.showInformationMessage('Delivery made succcessfully');
      } catch (err) {
        console.error(err);
        vscode.window.showErrorMessage('Failed to send email.It could have been because you haven\'t enabled access to less secure apps.Go to https://www.google.com/settings/security/lesssecureapps to do so');
      }
    } catch (err) {
      vscode.window.showErrorMessage('Could not zip files');
    }
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
