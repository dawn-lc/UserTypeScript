const root = process.cwd();
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, promises } from 'fs';
import esbuild from 'esbuild';
import inlineCSS from './inlineCSS.js';

var emojiSeq = String.raw`(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})`;
var emojiSTags = String.raw`\u{E0061}-\u{E007A}`;
var emojiRegex = new RegExp(String.raw`[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[${emojiSTags}]{2}[\u{E0030}-\u{E0039}${emojiSTags}]{1,3}\u{E007F}|${emojiSeq}(?:\u200D${emojiSeq})*`, "gu");
var isNull = (obj) => obj === null;
var isUndefined = (obj) => typeof obj === "undefined";
var isNullOrUndefined = (obj) => isUndefined(obj) || isNull(obj);
var isObject = (obj) => !isNullOrUndefined(obj) && typeof obj === "object" && !Array.isArray(obj);
var isString = (obj) => !isNullOrUndefined(obj) && typeof obj === "string";
var isNumber = (obj) => !isNullOrUndefined(obj) && typeof obj === "number";
var isElement = (obj) => !isNullOrUndefined(obj) && obj instanceof Element;
var isNode = (obj) => !isNullOrUndefined(obj) && obj instanceof Node;
var isNotEmpty = (obj) => {
    if (isNullOrUndefined(obj)) {
        return false;
    }
    if (Array.isArray(obj)) {
        return obj.some(isNotEmpty);
    }
    if (isString(obj)) {
        return !obj.isEmpty();
    }
    if (isNumber(obj)) {
        return !Number.isNaN(obj);
    }
    if (isElement(obj) || isNode(obj)) {
        return true;
    }
    if (isObject(obj)) {
        return Object.values(obj).some(isNotEmpty);
    }
    return true;
};
Array.prototype.any = function () {
    return this.filter((i) => !isNullOrUndefined(i)).length > 0;
};
Array.prototype.unique = function (prop) {
    if (isNullOrUndefined(prop)) {
        const seen = new Set();
        return this.filter((item) => {
            if (seen.has(item)) return false;
            seen.add(item);
            return true;
        });
    } else {
        const seen = new Map();
        const nanSymbol = Symbol();
        return this.filter((item) => {
            const rawKey = item[prop];
            const key = isNumber(rawKey) && Number.isNaN(rawKey) ? nanSymbol : rawKey;
            if (seen.has(key)) return false;
            seen.set(key, true);
            return true;
        });
    }
};
Array.prototype.union = function (that, prop) {
    return [...this, ...that].unique(prop);
};
Array.prototype.intersect = function (that, prop) {
    return this.filter((item) => that.some((t) => isNullOrUndefined(prop) ? t === item : t[prop] === item[prop])).unique(prop);
};
Array.prototype.difference = function (that, prop) {
    return this.filter((item) => !that.some((t) => isNullOrUndefined(prop) ? t === item : t[prop] === item[prop])).unique(prop);
};
Array.prototype.complement = function (that, prop) {
    return this.union(that, prop).difference(this.intersect(that, prop), prop);
};
String.prototype.isEmpty = function () {
    return !isNullOrUndefined(this) && this.length === 0;
};
String.prototype.isConvertibleToNumber = function (includeInfinity = false) {
    const trimmed = this.trim();
    if (trimmed === "") return false;
    return Number.isConvertibleNumber(Number(trimmed), includeInfinity);
};
String.prototype.reversed = function () {
    const segmenter = new Intl.Segmenter(navigator.language, {
        granularity: "grapheme"
    });
    return [...segmenter.segment(this.toString())].reverse().join("");
};
String.prototype.among = function (start, end, greedy = false, reverse = false) {
    if (this.isEmpty() || start.isEmpty() || end.isEmpty()) return "";
    if (!reverse) {
        const startIndex = this.indexOf(start);
        if (startIndex === -1) return "";
        const adjustedStartIndex = startIndex + start.length;
        const endIndex = greedy ? this.lastIndexOf(end) : this.indexOf(end, adjustedStartIndex);
        if (endIndex === -1 || endIndex < adjustedStartIndex) return "";
        return this.slice(adjustedStartIndex, endIndex);
    } else {
        const endIndex = this.lastIndexOf(end);
        if (endIndex === -1) return "";
        const adjustedEndIndex = endIndex - end.length;
        const startIndex = greedy ? this.indexOf(start) : this.lastIndexOf(start, adjustedEndIndex);
        if (startIndex === -1 || startIndex + start.length > adjustedEndIndex) return "";
        return this.slice(startIndex + start.length, endIndex);
    }
};
String.prototype.splitLimit = function (separator, limit) {
    if (this.isEmpty() || isNullOrUndefined(separator)) {
        throw new Error("Empty");
    }
    let body = this.split(separator);
    return limit ? body.slice(0, limit).concat(body.slice(limit).join(separator)) : body;
};
String.prototype.truncate = function (maxLength) {
    return this.length > maxLength ? this.substring(0, maxLength) : this.toString();
};
String.prototype.trimHead = function (prefix) {
    return this.startsWith(prefix) ? this.slice(prefix.length) : this.toString();
};
String.prototype.trimTail = function (suffix) {
    return this.endsWith(suffix) ? this.slice(0, -suffix.length) : this.toString();
};
String.prototype.replaceEmojis = function (replace) {
    return this.replaceAll(emojiRegex, replace ?? "");
};
String.prototype.toURL = function () {
    let URLString = this;
    if (URLString.split("//")[0].isEmpty()) {
        URLString = `${unsafeWindow.location.protocol}${URLString}`;
    }
    return new URL(URLString.toString());
};
function hasFunction(obj, method) {
    return isObject(obj) && method in obj && typeof obj[method] === "function";
};
function UUID() {
    return isNullOrUndefined(crypto) ? Array.from({
        length: 8
    }, () => ((1 + Math.random()) * 65536 | 0).toString(16).substring(1)).join("") : crypto.randomUUID().replaceAll("-", "");
};
function stringify(data) {
    switch (typeof data) {
        case "undefined":
            return "undefined";
        case "boolean":
            return data ? "true" : "false";
        case "number":
            return String(data);
        case "string":
            return data;
        case "symbol":
            return data.toString();
        case "function":
            return data.toString();
        case "object":
            if (isNull(data)) {
                return "null";
            }
            if (data instanceof Error) {
                return data.toString();
            }
            if (data instanceof Date) {
                return data.toISOString();
            }
            return JSON.stringify(data, null, 2);
        default:
            return "unknown";
    }
};
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
String.prototype.replaceVariable = function (replacements) {
    let current = this.toString();
    const seen = new Set();
    const keys2 = Object.keys(replacements).sort((a, b) => b.length - a.length);
    const patterns = keys2.map((key) => {
        const escKey = escapeRegex(key);
        return {
            value: replacements[key],
            placeholderRegex: new RegExp(`%#${escKey}(?::.*?)?#%`, "gs"),
            placeholderFormatRegex: new RegExp(`(?<=%#${escKey}:).*?(?=#%)`, "gs")
        };
    });
    while (true) {
        if (seen.has(current)) {
            console.warn("检测到循环替换！", `终止于: ${current}`);
            break;
        }
        seen.add(current);
        let modified = false;
        let next = current;
        for (const {
            value,
            placeholderRegex,
            placeholderFormatRegex
        } of patterns) {
            if (placeholderRegex.test(next)) {
                let format = next.match(placeholderFormatRegex) || [];
                if (format.any() && hasFunction(value, "format")) {
                    next = next.replace(placeholderRegex, stringify(value.format(format[0])));
                } else {
                    next = next.replace(placeholderRegex, stringify(value instanceof Date ? value.toISOString() : value));
                }
                modified = true;
            }
        }
        if (!modified) break;
        current = next;
    }
    return current;
};
function parseMetadata(content) {
    const lines = content
        .among('// ==UserScript==', '// ==/UserScript==')
        .split('\n')
        .filter(i => !i.isEmpty())
        .map(line => line.trimHead('// @'));
    if (!lines.any()) {
        throw new Error("No metadata block found");
    }
    let results = {};
    lines.reduce((result, line) => {
        const [key, value] = line.splitLimit(' ', 1).map(i => i.trim()).filter(i => !i.isEmpty());
        !isNullOrUndefined(key) && !isNullOrUndefined(value) &&
            !key.isEmpty() && !value.isEmpty()
            &&
            (!isNullOrUndefined(result[key])
                ? Array.isArray(result[key])
                    ? result[key].push(value)
                    : result[key] = [result[key], value]
                : result[key] = value
            );
        return result;
    }, results);
    return results;
};
function serializeMetadata(metadata) {
    let pad = Object.keys(metadata).reduce((a, b) => a.length > b.length ? a : b).length + 1;
    let results = ['// ==UserScript=='];
    Object.entries(metadata).reduce((result, [key, value]) => {
        Array.isArray(value)
            ? result.push(...value.map(v => `// @${key.padEnd(pad, ' ')}${v}`))
            : result.push(`// @${key.padEnd(pad, ' ')}${value}`);
        return result;
    }, results);
    results.push('// ==/UserScript==');
    return results.join('\r\n');
};
function mkdir(path) {
    return existsSync(path) || mkdirSync(path)
};
const distPath = join(root, 'dist');
mkdir(distPath);
const sourcePath = join(root, 'src');
const tsconfigPath = join(root, 'tsconfig.json');
let tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
const packagePath = join(root, 'package.json');
let packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
const mataTemplatePath = join(sourcePath, 'mata', 'userjs.mata');
const mataTempPath = join(distPath, `${packageInfo.displayName}.mata.js`);
let mataTemplate = parseMetadata(readFileSync(mataTemplatePath, 'utf8'));
let mata = { ...mataTemplate };
const releaseTag = process.argv[2] ?? 'dev';
mata.version = `${packageInfo.version}${releaseTag === 'dev' ? '-dev.' + UUID() : ''}`;
mata.updateURL = mata.updateURL.replaceVariable({
    'release_tag': releaseTag
});
mata.downloadURL = mata.downloadURL.replaceVariable({
    'release_tag': releaseTag
});
const matadata = serializeMetadata(mata)
writeFileSync(mataTempPath, matadata);
const mainPath = join(sourcePath, 'main.ts');
const distUncompressPath = join(distPath, `${packageInfo.displayName}.user.js`);
const distCompressPath = join(distPath, `${packageInfo.displayName}.min.user.js`);
esbuild.build({
    write: false,
    format: 'iife',
    entryPoints: [mainPath],
    bundle: true,
    treeShaking: false,
    minify: false,
    sourcemap: false,
    banner: {
        js: matadata
    },
    platform: 'browser',
    target: ['es2022'],
    loader: { '.json': 'json' },
    plugins: [inlineCSS],
    legalComments: 'none',
    charset: 'utf8',
    tsconfigRaw: tsconfig
}).then(async (result)=>{
    if (result.outputFiles.any()) {
        let output = result.outputFiles[0].text
            .replace(/\r?\n/gm, '\r\n')
            .replaceAll('/* @__PURE__ */', '')
            .replace(/.*\/\/ (?![=@]).*$/gm,'')
            .replace(/^\s*$/gm,'');
        await promises.writeFile(distUncompressPath, output);
    } else {
        process.exit(1);
    }
}).catch(() => process.exit(1));

esbuild.build({
    keepNames: true,
    allowOverwrite: true,
    format: 'iife',
    entryPoints: [mainPath],
    bundle: true,
    outfile: distCompressPath,
    minify: true,
    banner: {
        js: matadata
    },
    platform: 'browser',
    loader: { '.json': 'json' },
    target: ['es2022'],
    plugins: [inlineCSS],
    legalComments: 'none',
    charset: 'utf8',
    tsconfigRaw: tsconfig
}).catch(() => process.exit(1));