GM_addStyle('@!mainCSS!@');
async function main() {
    // do something
}
(unsafeWindow.document.body ? Promise.resolve() : new Promise(resolve => unsafeWindow.document.addEventListener("DOMContentLoaded", resolve))).then(main)