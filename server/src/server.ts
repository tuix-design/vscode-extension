import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

let connection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

documents.onDidChangeContent((e) => {
  validateStyle(e.document);
});

const setDiagnostic = (
  text: TextDocument,
  type: number,
  start: number,
  end: number,
  message: string
) => {
  let severity;
  switch (type) {
    case 0:
      severity = DiagnosticSeverity.Error;
      break;
    case 1:
      severity = DiagnosticSeverity.Hint;
      break;
    case 2:
      severity = DiagnosticSeverity.Information;
      break;
    case 3:
      severity = DiagnosticSeverity.Warning;
      break;
  }

  const result: Diagnostic = {
    severity,
    range: { start: text.positionAt(start), end: text.positionAt(end) },
    message,
  };
  return result;
};

const validateStyle = (text: TextDocument) => {
  const raw = text.getText();
  const pattern = /(?<=style="|hover=")[^"]*/g;
  let m: RegExpExecArray | null = null;
  let problems = 0;
  let diagnostics: Diagnostic[] = [];
  let diagnostic: Diagnostic;
  do {
    m = pattern.exec(raw);
    if (m) {
      const style = m[0];
      const styleList = style.split(" ");
      const lastIndex = pattern.lastIndex;
      const startIndex = lastIndex - m[0].length;
      styleList.forEach((item: string, i: number) => {
        let strOffset = styleList.slice(0, i).join(" ").length;
        if (i > 1) strOffset = strOffset + 1;
        const subStartIndex: number = startIndex + strOffset;
        const subLastIndex: number = subStartIndex + item.length;
        const duplicate: boolean =
          styleList.filter((stl) => stl === item).length > 1;
        if (duplicate) {
          diagnostics.push(
            setDiagnostic(
              text,
              3,
              subStartIndex,
              subLastIndex,
              `${item} is already used`
            )
          );
          connection.console.log(
            JSON.stringify(styleList.slice(0, i).join(" "))
          );
        }
      });
    }
  } while (m);

  connection.sendDiagnostics({ uri: text.uri, diagnostics });
};

documents.listen(connection);

connection.onInitialize((params) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
});

connection.onInitialized(() => {
  connection.console.log("hello");
});

connection.listen();
