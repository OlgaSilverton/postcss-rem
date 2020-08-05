const postcss = require('postcss');

const pluginName = 'postcss-rem';
const functionName = 'rem';
const defaults = {
  baseline: 16,
  convert: 'rem',
  fallback: false,
  precision: 5,
  useUnits: false,
};

module.exports = postcss.plugin(pluginName, (opts = {}) => (root) => {
  const options = Object.assign({}, defaults, opts);
  const regexp = options.useUnits
    ? /(?!\\W+)(\d*\.?\d+rem)/g
    : new RegExp('(?!\\W+)' + functionName + '\\(([^()]+)\\)', 'g');
  const fastSearch = options.useUnits ? functionName : functionName + '(';

  const rounded = (value, precision) => {
    precision = Math.pow(10, precision);
    return Math.floor(value * precision) / precision;
  };

  const convert = (values, to, fallback = false) =>
    values.replace(/(\d*\.?\d+)(rem|px)/g, (match, value, from) => {
      if (!options.useUnits && from === 'px' && to === 'rem') {
        return (
          rounded(parseFloat(value) / options.baseline, options.precision) + to
        );
      }
      if (from === 'rem' && to === 'px') {
        if (fallback && options.useUnits) {
          return rounded(parseFloat(value), options.precision) + to
        }
        return (
          rounded(parseFloat(value) * options.baseline, options.precision) + to
        );
      }
      if (options.useUnits && from === 'rem' && to === 'rem') {
        return (
          rounded(parseFloat(value) / options.baseline, options.precision) + to
        );
      }
      return match;
    });

  if (options.fallback && options.convert !== 'px') {
    root.walkDecls((decl) => {
      if (decl.value && decl.value.includes(fastSearch)) {
        let values = decl.value.replace(regexp, '$1');
        decl.cloneBefore({
          value: convert(values, 'px', true),
        });
        decl.value = convert(values, 'rem');
      }
    });
  } else {
    root.replaceValues(regexp, { fast: fastSearch }, (_, values) => {
      return convert(values, options.convert)
    });
  }
});
