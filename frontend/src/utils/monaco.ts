import type { Monaco } from '@monaco-editor/react';

let configured = false;

export function configureMonaco(monaco: Monaco): void {
  if (configured) return;
  configured = true;

  monaco.editor.defineTheme('cppbook-midnight', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7d8794' },
      { token: 'keyword', foreground: '8bd5ff' },
      { token: 'number', foreground: 'f0c674' },
      { token: 'string', foreground: 'b5e8a5' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#56616e',
      'editorCursor.foreground': '#38bdf8',
      'editor.selectionBackground': '#264456',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-obsidian', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280' },
      { token: 'keyword', foreground: 'a78bfa' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'string', foreground: '34d399' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#4b5563',
      'editorCursor.foreground': '#a78bfa',
      'editor.selectionBackground': '#312e81',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-graphite', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a8f98' },
      { token: 'keyword', foreground: '93c5fd' },
      { token: 'number', foreground: 'fde68a' },
      { token: 'string', foreground: '86efac' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#6b7280',
      'editorCursor.foreground': '#e5e7eb',
      'editor.selectionBackground': '#334155',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-matrix', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4ade80' },
      { token: 'keyword', foreground: '22c55e' },
      { token: 'number', foreground: 'bef264' },
      { token: 'string', foreground: '86efac' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#166534',
      'editorCursor.foreground': '#22c55e',
      'editor.selectionBackground': '#14532d',
      'editor.lineHighlightBackground': '#22c55e08',
    },
  });

  monaco.editor.defineTheme('cppbook-dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'string', foreground: 'f1fa8c' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#6272a4',
      'editorCursor.foreground': '#f8f8f2',
      'editor.selectionBackground': '#44475a',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-onedark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'string', foreground: '98c379' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#5c6370',
      'editorCursor.foreground': '#528bff',
      'editor.selectionBackground': '#3e4451',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-tokyonight', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '565f89' },
      { token: 'keyword', foreground: 'bb9af7' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'string', foreground: '9ece6a' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#565f89',
      'editorCursor.foreground': '#7aa2f7',
      'editor.selectionBackground': '#283457',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '616e88' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'string', foreground: 'a3be8c' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#4c566a',
      'editorCursor.foreground': '#88c0d0',
      'editor.selectionBackground': '#434c5e',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-mac', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '86868b' },
      { token: 'keyword', foreground: 'fc5a8d' },
      { token: 'number', foreground: '38bdf8' },
      { token: 'string', foreground: '34d399' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#86868b',
      'editorCursor.foreground': '#007aff',
      'editor.selectionBackground': '#2d2d2d',
      'editor.lineHighlightBackground': '#ffffff06',
    },
  });

  monaco.editor.defineTheme('cppbook-daylight', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '667085' },
      { token: 'keyword', foreground: '075985' },
      { token: 'number', foreground: '9a3412' },
      { token: 'string', foreground: '166534' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editorLineNumber.foreground': '#98a2b3',
      'editorCursor.foreground': '#0284c7',
      'editor.selectionBackground': '#bae6fd',
      'editor.lineHighlightBackground': '#00000006',
    },
  });

  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems() {
      const suggestions = [
        ['cout', 'std::cout << $1;'],
        ['cin', 'std::cin >> $1;'],
        ['vector', 'std::vector<$1> $2;'],
        ['fori', 'for (int i = 0; i < $1; ++i) {\n    $0\n}'],
        ['main', 'int main() {\n    $0\n    return 0;\n}'],
        ['class', 'class $1 {\npublic:\n    $1() = default;\n};'],
      ].map(([label, insertText]) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      }));
      return { suggestions };
    },
  });
}
