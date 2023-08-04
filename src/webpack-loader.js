import path from 'node:path';

export default function loader(source) {
  const options = this.getOptions();

  console.log(source);

  source = source.replace(/\[name\]/g, options.name);

  return `export default ${JSON.stringify(source)}`;
}
