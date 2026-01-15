const path = require('path');
const vscode = require('vscode');

const COMMAND_ID = 'cypress.toggleOnlyAndCopyPath';

function activate(context) {
  const provider = {
    provideCodeLenses(document) {
      if (!document.uri.fsPath.endsWith('.cy.ts') && !document.uri.fsPath.endsWith('.cy.js')) {
        return [];
      }

      const codeLenses = [];
      const text = document.getText();
      const regex = /\bit(\.only)?\s*\(/g;
      let match;

      while ((match = regex.exec(text))) {
        const position = document.positionAt(match.index);
        const range = new vscode.Range(position, position);

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '★ ONLY',
            command: COMMAND_ID,
            arguments: [document.uri, position.line]
          })
        );
      }

      return codeLenses;
    }
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider([{ language: 'typescript' }, { language: 'javascript' }], provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_ID, async (uri, line) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      const lineText = document.lineAt(line).text;
      const itOnlyRegex = /\bit\.only\s*\(/;
      const itRegex = /\bit\s*\(/;

      const edit = new vscode.WorkspaceEdit();
      let hasChanges = false;
      const isCurrentOnly = itOnlyRegex.test(lineText);

      for (let i = 0; i < document.lineCount; i += 1) {
        const currentLineText = document.lineAt(i).text;
        if (!itOnlyRegex.test(currentLineText)) {
          continue;
        }

        if (i === line) {
          continue;
        }

        const updatedLineText = currentLineText.replace(/\bit\.only\s*\(/, 'it(');
        edit.replace(uri, new vscode.Range(i, 0, i, currentLineText.length), updatedLineText);
        hasChanges = true;
      }

      let newLine = lineText;
      if (isCurrentOnly) {
        newLine = lineText.replace(/\bit\.only\s*\(/, 'it(');
        edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
        hasChanges = true;
      } else if (itRegex.test(lineText)) {
        newLine = lineText.replace(/\bit\s*\(/, 'it.only(');
        edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
        hasChanges = true;
      }

      if (hasChanges) {
        await vscode.workspace.applyEdit(edit);
        await document.save();
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (workspaceFolder) {
        const relPath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
        await vscode.env.clipboard.writeText(relPath);
      }

      if (editor) {
        editor.selection = new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0));
      }
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
