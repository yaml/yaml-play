// Browser-compatible wrapper for yaml-reference-parser
// Loads the JS files built by `make refparser-build` from public/refparse/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Parser: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TestReceiverClass: any = null;
let grammarLoaded = false;

async function loadGrammar(): Promise<void> {
  if (grammarLoaded) return;

  // Fetch all required JS files
  const [preludeCode, grammarCode, parserCode, receiverCode, testReceiverCode] = await Promise.all([
    fetch('/refparse/prelude.js').then(r => r.text()),
    fetch('/refparse/grammar.js').then(r => r.text()),
    fetch('/refparse/parser.js').then(r => r.text()),
    fetch('/refparse/receiver.js').then(r => r.text()),
    fetch('/refparse/test-receiver.js').then(r => r.text()),
  ]);

  // Use indirect eval to run in global scope
  // The prelude sets up window._ and other globals
  // The other files use 'global' which we alias to window
  const globalEval = eval;

  // Set up 'global' as an alias for window (Node.js compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).global = window;

  // Load files in order - prelude first to set up globals
  globalEval(preludeCode);
  globalEval(grammarCode);
  globalEval(parserCode);
  globalEval(receiverCode);
  globalEval(testReceiverCode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Parser = (window as any).Parser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TestReceiverClass = (window as any).TestReceiver;
  grammarLoaded = true;
}

export interface RefparseResult {
  status: number;
  output: string;
}

export async function runRefparse(yamlText: string): Promise<RefparseResult> {
  try {
    await loadGrammar();

    if (!TestReceiverClass) {
      return { status: 1, output: 'TestReceiverClass not loaded' };
    }
    if (!Parser) {
      return { status: 1, output: 'Parser not loaded' };
    }

    const receiver = new TestReceiverClass();
    const parser = new Parser(receiver);

    parser.parse(yamlText);

    // output() is a method in parser-1.2
    const rawOutput = parser.receiver.output();

    // Remove trailing newline to match expected format
    const output = rawOutput.replace(/\n$/, '');

    return {
      status: 0,
      output: output || '(empty output)',
    };
  } catch (error) {
    return {
      status: 1,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}
