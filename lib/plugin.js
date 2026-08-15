// Cordis plugin entry: HTTP API + periodic quota refresh.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from './domain.js';
import { registerHttp } from './http.js';
const CLIENT_ID = '@agentteam/model-sync';
function shortRev(buf) {
    let hash = 0;
    for (let i = 0; i < buf.length; i++)
        hash = (hash * 33 + buf[i]) >>> 0;
    return hash.toString(16).padStart(8, '0');
}
function injectBootEntry(html, id, rev) {
    const tag = '<!--model-sync-boot-->';
    if (html.includes(tag))
        return html;
    const script = `${tag}<script>(function(){var g=window.__DSH_BOOT__;if(!g||!g.entries)return;var id=${JSON.stringify(id)};var row;for(var i=0;i<g.entries.length;i++)if(g.entries[i].id===id)row=g.entries[i];if(row){row.immediately=true;row.rev=${JSON.stringify(rev)};row.url="/plugins/"+id+"/client.js?rev="+row.rev;}else{g.entries.push({id:id,url:"/plugins/"+id+"/client.js?rev="+${JSON.stringify(rev)},rev:${JSON.stringify(rev)},immediately:true,inject:["@deepseek-ai/dsh-client-runtime","@deepseek-ai/dsh-client-ui-settings","@deepseek-ai/dsh-client-locale"]});}})();</script>`;
    const close = html.lastIndexOf('</head>');
    if (close < 0)
        return html + script;
    return `${html.slice(0, close)}${script}${html.slice(close)}`;
}
function ensureClientBootEntry(ctx) {
    const web = ctx.get('webServer');
    if (!web?.tapIndex)
        return () => { };
    let rev = '0';
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        rev = shortRev(readFileSync(join(here, 'client.js')));
    }
    catch {
        rev = String(Date.now());
    }
    return web.tapIndex((html) => injectBootEntry(html, CLIENT_ID, rev));
}
export const name = 'model-sync';
export const inject = ['credentials', 'webServer'];
export { Config };
export function apply(ctx, raw) {
    const config = Config(raw ?? {});
    const log = ctx.logger(name);
    ctx.effect(() => {
        const disposeHttp = registerHttp(ctx, config);
        const disposeBoot = ensureClientBootEntry(ctx);
        log.info(`HTTP API at ${'/agentteam/model-sync'} (poll ${config.pollMs}ms)`);
        return () => {
            disposeBoot();
            disposeHttp();
        };
    });
}
