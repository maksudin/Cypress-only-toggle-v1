const path = require('path');
const vscode = require('vscode');

const COMMAND_ID = 'cypress.toggleOnlyAndCopyPath';
const COMMAND_HIDE_ID = 'cypress.toggleHideApiLogs';
const COMMAND_RUN_HEADLESS_ID = 'cypress.toggleOnlyAndRunHeadless';
const COMMAND_SKIP_ID = 'cypress.toggleSkip';

const HIDE_API_BLOCK = [
  'before(() => {',
  '  const app = window.top;',
  "  if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {",
  "    const style = app.document.createElement('style');",
  "    style.innerHTML = '.command-name-request, .command-name-xhr { display: none; }';",
  "    style.setAttribute('data-hide-command-log-request', '');",
  '    app.document.head.appendChild(style);',
  '  }',
  '});'
].join('\n');

function activate(context) {
  const provider = {
    provideCodeLenses(document) {
      if (!document.uri.fsPath.endsWith('.cy.ts') && !document.uri.fsPath.endsWith('.cy.js')) {
        return [];
      }

      const codeLenses = [];
      const text = document.getText();
      const itRegex = /\b(?:it|xit)(\.only)?\s*\(/g;
      const describeRegex = /\b(?:describe|xdescribe)(\.only)?\s*\(/g;
      let match;

      while ((match = itRegex.exec(text))) {
        const position = document.positionAt(match.index);
        const range = new vscode.Range(position, position);

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '⭐ ONLY',
            command: COMMAND_ID,
            arguments: [document.uri, position.line]
          })
        );

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '▶️ RUN HL',
            command: COMMAND_RUN_HEADLESS_ID,
            arguments: [document.uri, position.line]
          })
        );

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '🛑 OFF',
            command: COMMAND_SKIP_ID,
            arguments: [document.uri, position.line]
          })
        );
      }

      while ((match = describeRegex.exec(text))) {
        const position = document.positionAt(match.index);
        const range = new vscode.Range(position, position);

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '⭐ ONLY',
            command: COMMAND_ID,
            arguments: [document.uri, position.line]
          })
        );

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '▶️ RUN HL',
            command: COMMAND_RUN_HEADLESS_ID,
            arguments: [document.uri, position.line]
          })
        );

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '🛑 OFF',
            command: COMMAND_SKIP_ID,
            arguments: [document.uri, position.line]
          })
        );

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: '👀 HIDE API',
            command: COMMAND_HIDE_ID,
            arguments: [document.uri]
          })
        );
      }

      return codeLenses;
    }
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider([{ language: 'typescript' }, { language: 'javascript' }], provider)
  );

  const toggleOnly = async (uri, line) => {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const lineText = document.lineAt(line).text;
    const itOnlyRegex = /\bit\.only\s*\(/;
    const itRegex = /\bit\s*\(/;
    const xitRegex = /\bxit\s*\(/;
    const describeOnlyRegex = /\bdescribe\.only\s*\(/;
    const describeRegex = /\bdescribe\s*\(/;
    const xdescribeRegex = /\bxdescribe\s*\(/;

    const edit = new vscode.WorkspaceEdit();
    let hasChanges = false;
    let shouldCopyPath = false;
    const isCurrentOnly = itOnlyRegex.test(lineText) || describeOnlyRegex.test(lineText);

    let newLine = lineText;
    if (isCurrentOnly) {
      newLine = lineText.replace(/\bit\.only\s*\(/, 'it(').replace(/\bdescribe\.only\s*\(/, 'describe(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (xitRegex.test(lineText)) {
      newLine = lineText.replace(/\bxit\s*\(/, 'it.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
      shouldCopyPath = true;
    } else if (xdescribeRegex.test(lineText)) {
      newLine = lineText.replace(/\bxdescribe\s*\(/, 'describe.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
      shouldCopyPath = true;
    } else if (itRegex.test(lineText)) {
      newLine = lineText.replace(/\bit\s*\(/, 'it.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
      shouldCopyPath = true;
    } else if (describeRegex.test(lineText)) {
      newLine = lineText.replace(/\bdescribe\s*\(/, 'describe.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
      shouldCopyPath = true;
    }

    if (hasChanges) {
      await vscode.workspace.applyEdit(edit);
      await document.save();
    }

    if (editor) {
      editor.selection = new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0));
    }

    if (!shouldCopyPath) {
      return null;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      const relPath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
      await vscode.env.clipboard.writeText(relPath);
      return relPath;
    }

    return null;
  };

  const setOnlyExclusive = async (uri, line) => {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const lineText = document.lineAt(line).text;
    const itOnlyRegex = /\bit\.only\s*\(/;
    const itRegex = /\bit\s*\(/;
    const xitRegex = /\bxit\s*\(/;
    const describeOnlyRegex = /\bdescribe\.only\s*\(/;
    const describeRegex = /\bdescribe\s*\(/;
    const xdescribeRegex = /\bxdescribe\s*\(/;

    const edit = new vscode.WorkspaceEdit();
    let hasChanges = false;

    for (let i = 0; i < document.lineCount; i += 1) {
      const currentLineText = document.lineAt(i).text;
      if (!itOnlyRegex.test(currentLineText) && !describeOnlyRegex.test(currentLineText)) {
        continue;
      }

      if (i === line) {
        continue;
      }

      const updatedLineText = currentLineText
        .replace(/\bit\.only\s*\(/, 'it(')
        .replace(/\bdescribe\.only\s*\(/, 'describe(');
      edit.replace(uri, new vscode.Range(i, 0, i, currentLineText.length), updatedLineText);
      hasChanges = true;
    }

    if (xitRegex.test(lineText)) {
      const newLine = lineText.replace(/\bxit\s*\(/, 'it.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (xdescribeRegex.test(lineText)) {
      const newLine = lineText.replace(/\bxdescribe\s*\(/, 'describe.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (itRegex.test(lineText) && !itOnlyRegex.test(lineText)) {
      const newLine = lineText.replace(/\bit\s*\(/, 'it.only(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (describeRegex.test(lineText) && !describeOnlyRegex.test(lineText)) {
      const newLine = lineText.replace(/\bdescribe\s*\(/, 'describe.only(');
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
      return relPath;
    }

    if (editor) {
      editor.selection = new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0));
    }

    return null;
  };

  const toggleSkip = async (uri, line) => {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const lineText = document.lineAt(line).text;
    const xitRegex = /\bxit\s*\(/;
    const xdescribeRegex = /\bxdescribe\s*\(/;
    const itRegex = /\bit(\.only)?\s*\(/;
    const describeRegex = /\bdescribe(\.only)?\s*\(/;

    const edit = new vscode.WorkspaceEdit();
    let hasChanges = false;

    if (xitRegex.test(lineText)) {
      const newLine = lineText.replace(/\bxit\s*\(/, 'it(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (xdescribeRegex.test(lineText)) {
      const newLine = lineText.replace(/\bxdescribe\s*\(/, 'describe(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (describeRegex.test(lineText)) {
      const newLine = lineText.replace(/\bdescribe(\.only)?\s*\(/, 'xdescribe(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    } else if (itRegex.test(lineText)) {
      const newLine = lineText.replace(/\bit(\.only)?\s*\(/, 'xit(');
      edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
      hasChanges = true;
    }

    if (hasChanges) {
      await vscode.workspace.applyEdit(edit);
      await document.save();
    }

    if (editor) {
      editor.selection = new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0));
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_ID, async (uri, line) => {
      await toggleOnly(uri, line);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_RUN_HEADLESS_ID, async (uri, line) => {
      const relPath = await setOnlyExclusive(uri, line);
      if (!relPath) {
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        return;
      }

      const terminalName = 'Cypress Runner Headless';
      let terminal = vscode.window.terminals.find((t) => t.name === terminalName);
      if (!terminal) {
        terminal = vscode.window.createTerminal({
          name: terminalName,
          location: vscode.TerminalLocation.Editor
        });
      }

      const cwd = workspaceFolder.uri.fsPath;
      const command = `cd "${cwd}"\n` + `npx cypress run --config-file cypress.config.localhost.ts --spec "${relPath}"`;

      terminal.show();
      terminal.sendText(command, true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_SKIP_ID, async (uri, line) => {
      await toggleSkip(uri, line);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_HIDE_ID, async (uri) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);
      const text = document.getText();

      const blockRegex = /before\(\(\)\s*=>\s*\{[\s\S]*?\}\);\s*/g;
      let match;
      let removed = false;
      const edit = new vscode.WorkspaceEdit();

      while ((match = blockRegex.exec(text))) {
        const blockText = match[0];
        if (!blockText.includes('data-hide-command-log-request')) {
          continue;
        }

        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + blockText.length);
        edit.delete(uri, new vscode.Range(start, end));
        removed = true;
        break;
      }

      if (removed) {
        await vscode.workspace.applyEdit(edit);
        await document.save();
        return;
      }

      let insertLine = null;
      for (let i = 0; i < document.lineCount; i += 1) {
        if (/\bbefore\s*\(/.test(document.lineAt(i).text)) {
          insertLine = i;
          break;
        }
      }

      if (insertLine === null) {
        for (let i = 0; i < document.lineCount; i += 1) {
          if (/\bdescribe\s*\(/.test(document.lineAt(i).text)) {
            insertLine = i + 1;
            break;
          }
        }
      }

      if (insertLine === null) {
        return;
      }

      const baseIndent = (document.lineAt(insertLine).text.match(/^\s*/) || [''])[0];
      const indent = baseIndent.length === 0 ? '  ' : baseIndent;
      const indentedBlock = HIDE_API_BLOCK.split('\n')
        .map((line) => (line.length > 0 ? `${indent}${line}` : line))
        .join('\n');

      edit.insert(uri, new vscode.Position(insertLine, 0), `${indentedBlock}\n\n`);
      await vscode.workspace.applyEdit(edit);
      await document.save();

      if (editor) {
        editor.selection = new vscode.Selection(new vscode.Position(insertLine, 0), new vscode.Position(insertLine, 0));
      }
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
