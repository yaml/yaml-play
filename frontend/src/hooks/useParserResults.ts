import { useState, useCallback, useRef } from 'react';
import { ParserResult } from '../lib/types';
import { parsers, getParser } from '../lib/parsers';
import { runParser } from '../lib/sandbox';
import { runRefparse } from '../lib/refparse';
import { compareOutputs } from '../lib/normalize';

// All parser IDs except refparse
const ALL_OTHER_PARSER_IDS = parsers.filter(p => p.id !== 'refparse').map(p => p.id);

export function useParserResults() {
  const [results, setResults] = useState<Map<string, ParserResult>>(new Map());
  const [refOutput, setRefOutput] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const runAllParsers = useCallback(async (yamlText: string, _visibleParserIds: string[]) => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Set ALL parsers to loading (we run all for status bar counts)
    setResults(prev => {
      const next = new Map(prev);
      // Always include refparse
      next.set('refparse', {
        parserId: 'refparse',
        output: '',
        status: 0,
        loading: true,
      });
      // Set all other parsers to loading
      ALL_OTHER_PARSER_IDS.forEach(id => {
        next.set(id, {
          parserId: id,
          output: '',
          status: 0,
          loading: true,
        });
      });
      return next;
    });

    // Run reference parser first (in-browser, no sandbox needed)
    const refResponse = await runRefparse(yamlText);
    const refResultOutput = refResponse.output;
    const refResultStatus = refResponse.status;
    setRefOutput(refResultOutput);
    setResults(prev => {
      const next = new Map(prev);
      next.set('refparse', {
        parserId: 'refparse',
        output: refResponse.output,
        status: refResponse.status,
        loading: false,
        matches: refResponse.status === 0, // Red when YAML is invalid
        agrees: true, // refparse always agrees with itself
      });
      return next;
    });

    // Run ALL other parsers in parallel (not just visible ones)
    await Promise.all(
      ALL_OTHER_PARSER_IDS.map(async (parserId) => {
        const parser = parsers.find(p => p.id === parserId);
        if (!parser) return;

        const response = await runParser(parserId, yamlText, parser.version);

        // Determine agreement and match status:
        // - agrees: does this parser agree with refparse? (for status bar)
        // - matches: should header be green? (valid YAML + agrees with refparse)
        let agrees: boolean | undefined;
        let matches: boolean | undefined;

        if (response.status === -1) {
          // Connection error - doesn't agree, show red
          agrees = false;
          matches = false;
        } else if (parserId === 'refhs') {
          // refhs outputs are never comparable - just compare success/failure
          const refSucceeded = refResultStatus === 0;
          const parserSucceeded = response.status === 0;
          agrees = refSucceeded === parserSucceeded;
          // Green only if YAML is valid AND agrees
          matches = refResultStatus === 0 && agrees;
        } else if (refResultStatus !== 0) {
          // refparse errored (invalid YAML) - agrees if this also errors
          agrees = response.status !== 0;
          // But show red since YAML is invalid
          matches = false;
        } else {
          // refparse succeeded - agrees if this succeeds AND outputs match
          agrees = response.status === 0 && compareOutputs(refResultOutput, response.output, parserId);
          matches = agrees;
        }

        setResults(prev => {
          const next = new Map(prev);
          next.set(parserId, {
            parserId,
            output: response.output,
            status: response.status,
            loading: false,
            matches,
            agrees,
            versionMismatch: response.versionMismatch,
          });
          return next;
        });
      })
    );
  }, []);

  const getResult = useCallback((parserId: string): ParserResult | undefined => {
    return results.get(parserId);
  }, [results]);

  const getAgreementCount = useCallback((): {
    total: number;
    disagreeing: number;
    disagreeingNames: string[];
    loading: boolean;
  } => {
    const disagreeingNames: string[] = [];
    let loadingCount = 0;

    // Check all non-refparse parsers
    ALL_OTHER_PARSER_IDS.forEach((parserId) => {
      const result = results.get(parserId);
      if (!result || result.loading) {
        loadingCount++;
      } else {
        if (!result.agrees) {
          const parser = getParser(parserId);
          disagreeingNames.push(parser?.name || parserId);
        }
      }
    });

    return {
      total: ALL_OTHER_PARSER_IDS.length,
      disagreeing: disagreeingNames.length,
      disagreeingNames,
      loading: loadingCount > 0,
    };
  }, [results]);

  return {
    results,
    refOutput,
    runAllParsers,
    getResult,
    getAgreementCount,
  };
}
