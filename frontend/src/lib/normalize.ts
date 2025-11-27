// Output normalization for parser comparison
// Ported from playground.coffee

// Common normalization applied to all outputs before comparison
function normalizeForComparison(output: string): string {
  return output
    // Remove trailing flow indicators like {} or []
    .replace(/\s+(\{\}|\[\])$/mg, '')
    // Remove =COMMENT lines
    .replace(/^=COMMENT .*\n?/mg, '')
    // Keep only event lines (starting with -, +, =)
    .replace(/^[^+\-=].*\n?/gm, '')
    // Normalize trailing whitespace
    .trim();
}

export function compareOutputs(refOutput: string, parserOutput: string, parserId: string): boolean {
  // Apply common normalization to both
  let ref = normalizeForComparison(refOutput);
  let parser = normalizeForComparison(parserOutput);

  // Parser-specific adjustments
  if (parserId === 'rustyaml') {
    // Convert Rust tag format to YAML canonical
    parser = parser
      .replace(/<Tag\("!!", "(.*?)"\)>/g, '<tag:yaml.org,2002:$1>')
      .replace(/<Tag\("!", "(.*?)"\)>/g, '<!$1>')
      .replace(/<Tag\("", "!"\)>/g, '<!>')
      .replace(/<Tag\("", "(tag:.*?)"\)>/g, '<$1>')
      .replace(/<Tag\("", "(!.*?)"\)>/g, '<$1>');

    ref = ref
      .replace(/^\+DOC ---/gm, '+DOC')
      .replace(/^-DOC \.\.\./gm, '-DOC')
      .replace(/^=VAL :$/gm, '=VAL :~')
      .replace(/^\+MAP \{\}( ?)/gm, '+MAP$1')
      .replace(/^\+SEQ \[\]( ?)/gm, '+SEQ$1');

    // Handle numeric anchors - if rustyaml uses &1, convert ref's named anchors
    if (parser.match(/&1/)) {
      let i = 1;
      let match;
      while ((match = ref.match(/&([a-zA-Z]\S*)/))) {
        const anchor = match[1];
        ref = ref.replace(new RegExp(`([&*])${anchor}`, 'g'), `$1${i}`);
        i++;
      }
    }
  }

  if (parserId === 'goyaml') {
    // If ref has implicit +DOC, normalize explicit +DOC ---
    if (ref.match(/^\+DOC$/m)) {
      parser = parser.replace(/^\+DOC ---/m, '+DOC');
    }
  }

  return ref === parser;
}
