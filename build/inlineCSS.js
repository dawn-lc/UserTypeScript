import path from 'path';
const inlineCSS = {
    name: 'inlineCSS',
    setup(build) {
        build.onResolve({ filter: /\.css$/ }, (args) => {
            return {
                path: path.join(args.resolveDir, args.path),
                namespace: 'inlineCSS',
            };
        });
        build.onLoad({ filter: /.*/, namespace: 'inlineCSS' }, async (args) => {
            try {
                const result = await build.esbuild.build({
                    entryPoints: [args.path],
                    write: false,
                    loader: {
                        '.css': 'css'
                    },
                    minify: true,
                    platform: 'neutral'
                });
                const cssContent = result.outputFiles[0].text;
                const contents = `export default ${JSON.stringify(cssContent)};`;
                return {
                    contents,
                    loader: 'js'
                };
            } catch (error) {
                return {
                    errors: [{
                        text: `Failed to inline CSS: ${error.message}`,
                        detail: error
                    }]
                };
            }
        });
    },
};
export default inlineCSS;