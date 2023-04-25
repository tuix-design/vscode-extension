import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { style } from "./style";

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

const getTextIndex = (list: string[], i: number, start: number) => {
  let strOffset = list.slice(0, i).join(" ").length;
  if (i > 0) strOffset = strOffset + 1;
  const subStartIndex: number = start + strOffset;
  const subLastIndex: number = subStartIndex + list[i].length;
  return { subLastIndex, subStartIndex };
};

const validateStyle = (text: TextDocument) => {
  const raw = text.getText();
  const pattern = /(?<=style="|hover=")[^"]*/g;
  let m: RegExpExecArray | null = null;
  let diagnostics: Diagnostic[] = [];
  do {
    m = pattern.exec(raw);
    if (m) {
      const currentStyle = m[0];
      const styleList = currentStyle.split(" ");
      const lastIndex = pattern.lastIndex;
      const startIndex = lastIndex - m[0].length;
      let duplicateList: number[] = [];
      styleList.forEach((value: string, i) => {
        if (value !== "" && value.length >= 2) {
          const index = value.includes(":") ? value.split(":")[0] : value;
          const filter = styleList.filter((item) => {
            const itm = item.includes(":") ? item.split(":")[0] : item;
            if (itm === index) {
              return item;
            }
          });
          if (filter.length > 1) {
            filter.forEach((item) => {
              duplicateList.push(styleList.indexOf(item));
              duplicateList.push(i);
            });
          }

          if (!style[index]) {
            const { subStartIndex, subLastIndex } = getTextIndex(
              styleList,
              i,
              startIndex
            );
            diagnostics.push(
              setDiagnostic(text, 0, subStartIndex, subLastIndex, `unknown`)
            );
          }
        }
      });

      new Set(duplicateList).forEach((elm) => {
        const { subStartIndex, subLastIndex } = getTextIndex(
          styleList,
          elm,
          startIndex
        );
        diagnostics.push(
          setDiagnostic(
            text,
            3,
            subStartIndex,
            subLastIndex,
            `${styleList[elm]} is already used`
          )
        );
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
