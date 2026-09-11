export async function createEngine(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {}, {
    builtins: ['js-string'], importedStringConstants: '_',
  });
  const invoke = (name, request) => {
    let json;
    try { json = instance.exports[name](JSON.stringify(request)); }
    catch (error) { throw new Error(`MoonBit execution failed: ${error.message}`); }
    return JSON.parse(json);
  };
  return {
    version: '0.1.0-candidate',
    add: instance.exports.add,
    echo: request => invoke('echo_json', request),
    validateHistory: request => invoke('validate_history_json', request),
    analyze: request => invoke('analyze_json', request),
    compare: request => invoke('compare_json', request),
    ui: request => invoke('ui_json', request),
  };
}
