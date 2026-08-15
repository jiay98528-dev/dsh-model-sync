window.__ModuleLoader__.load({
	id: 'dsh-model-sync',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require('react');
		var h = React.createElement;

		var CSS_ID = 'dsh-model-sync/ui.css';
		var CSS = [
			'.msync-page{display:flex;flex-direction:column;gap:16px;max-width:760px;color:var(--dsw-alias-label-primary)}',
			'.msync-page h2{margin:0;font-size:16px;font-weight:600}',
			'.msync-page p.lead{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}',
			'.msync-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}',
			'.msync-row{display:flex;align-items:center;justify-content:space-between;gap:12px}',
			'.msync-row .name{font-size:13px;font-weight:600}',
			'.msync-row .hint{font-size:12px;color:var(--dsw-alias-label-tertiary)}',
			'.msync-btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:6px;padding:4px 10px;font:inherit;cursor:pointer}',
			'.msync-btn[disabled]{opacity:.45;cursor:default}',
			'.msync-btn.primary{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}',
			'.msync-switch{appearance:none;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l2);position:relative;cursor:pointer;border:0}',
			'.msync-switch:checked{background:var(--dsw-alias-state-business-primary)}',
			'.msync-switch:before{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}',
			'.msync-switch:checked:before{left:18px}',
			'.msync-models{display:flex;flex-wrap:wrap;gap:6px}',
			'.msync-chip{font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 8px}',
			'.msync-chip.new{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}',
			'.msync-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:0}',
			'.msync-ring{position:relative;width:28px;height:28px;display:inline-flex}',
			'.msync-ring svg{display:block}',
			'.msync-pop{position:absolute;bottom:calc(100% + 8px);right:0;left:auto;transform:none;min-width:280px;max-width:420px;padding:10px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-shadow-lv1);z-index:20;display:none}',
			'.msync-wrap:hover .msync-pop,.msync-wrap:focus-within .msync-pop{display:block}',
			'.msync-pop h4{margin:0 0 6px;font-size:12px}',
			'.msync-pop .line{font-size:12px;color:var(--dsw-alias-label-secondary);display:flex;justify-content:space-between;gap:10px}',
			'.msync-pop .prov{display:flex;flex-direction:column;gap:3px}',
			'.msync-wrap{position:relative;display:inline-flex;align-items:center}',
		].join('');

		function ensureCss() {
			if (typeof document === 'undefined') return;
			if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]')) return;
			var tag = document.createElement('style');
			tag.dataset.plugin = 'dsh-model-sync';
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		function api(path, options) {
			return fetch('/agentteam/model-sync' + path, Object.assign({ headers: { accept: 'application/json', 'content-type': 'application/json' } }, options || {})).then(function (res) {
				return res.json().then(function (body) {
					if (!res.ok) throw new Error(body && body.error ? body.error : 'HTTP ' + res.status);
					return body;
				});
			});
		}

		function pct(window) {
			if (!window || !window.limit) return 0;
			return Math.max(0, Math.min(1, window.remaining / window.limit));
		}

		function findWindow(windows, key) {
			if (!windows) return undefined;
			for (var i = 0; i < windows.length; i++) if (windows[i].key === key) return windows[i];
			return undefined;
		}

		function findBalance(providers) {
			if (!providers) return undefined;
			for (var i = 0; i < providers.length; i++) {
				var b = providers[i].quota && providers[i].quota.balance;
				if (b && b.lastRecharge > 0) return b;
			}
			return undefined;
		}

		function balancePct(balance) {
			if (!balance || !(balance.lastRecharge > 0)) return undefined;
			return Math.max(0, Math.min(1, balance.current / balance.lastRecharge));
		}

		function money(unit, value) {
			var sym = unit === 'CNY' ? '¥' : unit === 'USD' ? '$' : ((unit || '') + ' ');
			return sym + Number(value).toFixed(2);
		}

		function formatBalance(balance) {
			var p = balancePct(balance);
			if (p === undefined) return undefined;
			return '剩余 ' + (p * 100).toFixed(1) + '% · 当前 ' + money(balance.unit, balance.current) + ' / 基准 ' + money(balance.unit, balance.lastRecharge);
		}

		function DualRing(props) {
			var providers = props.providers || [];
			var windows = [];
			for (var pi = 0; pi < providers.length; pi++) {
				var qw = providers[pi].quota && providers[pi].quota.windows;
				if (qw) for (var wj = 0; wj < qw.length; wj++) windows.push(qw[wj]);
			}
			var quota = props.quota;
			var w5 = findWindow(windows, '5h') || findWindow(windows, 'rate') || findWindow(quota && quota.windows, '5h') || findWindow(quota && quota.windows, 'rate');
			var w7 = findWindow(windows, '7d') || findWindow(quota && quota.windows, '7d');
			var p5 = w5 ? pct(w5) : 0;
			var p7 = w7 ? pct(w7) : 0;
			var c5 = 2 * Math.PI * 6;
			var c7 = 2 * Math.PI * 10;
			var balance = findBalance(providers) || (quota && quota.balance);
			var bp = balancePct(balance);
			var dotColor = bp === undefined ? 'transparent'
				: bp >= 0.5 ? 'var(--dsw-alias-state-business-primary)'
				: bp >= 0.2 ? 'var(--dsw-alias-state-warn-primary)'
				: 'var(--dsw-alias-state-error-primary)';
			return h('span', { className: 'msync-wrap', tabIndex: 0, title: bp === undefined ? '额度' : '额度 · API 余额剩余 ' + Math.round(bp * 100) + '%' },
				h('span', { className: 'msync-ring', 'aria-label': '额度' },
					h('svg', { width: 28, height: 28, viewBox: '0 0 28 28' },
						h('circle', { cx: 14, cy: 14, r: 10, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2.2 }),
						h('circle', {
							cx: 14, cy: 14, r: 10, fill: 'none',
							stroke: w7 ? 'var(--dsw-alias-state-business-primary)' : 'transparent',
							strokeWidth: 2.2, strokeLinecap: 'round',
							strokeDasharray: String(c7),
							strokeDashoffset: String(c7 * (1 - p7)),
							transform: 'rotate(-90 14 14)',
						}),
						h('circle', { cx: 14, cy: 14, r: 6, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2 }),
						h('circle', {
							cx: 14, cy: 14, r: 6, fill: 'none',
							stroke: w5 ? 'var(--dsw-alias-label-primary)' : 'transparent',
							strokeWidth: 2, strokeLinecap: 'round',
							strokeDasharray: String(c5),
							strokeDashoffset: String(c5 * (1 - p5)),
							transform: 'rotate(-90 14 14)',
						}),
						h('circle', { cx: 14, cy: 14, r: 2.6, fill: dotColor }),
					),
				),
				h('div', { className: 'msync-pop', role: 'dialog' },
					h('h4', null, props.model ? (props.provider + ' / ' + props.model) : '当前会话额度'),
					providers.length === 0
						? h('div', { className: 'line' }, props.hint || '尚未识别当前模型')
						: providers.map(function (prov) {
							var q = prov.quota || {};
							var rows = q.windows || [];
							var cells = [];
							if (rows.length) {
								cells.push(h('div', { key: 'w', className: 'line' },
									h('span', null, '内 5h / 外 7d'),
									h('span', null, rows.map(function (w) { return w.label + ' 剩余 ' + Math.round(pct(w) * 100) + '%'; }).join(' · ')),
								));
							} else if (q.reason && !q.balance) {
								cells.push(h('div', { key: 'r', className: 'line' }, h('span', null, ''), h('span', null, q.reason)));
							}
							var fb = q.balance && formatBalance(q.balance);
							if (fb) {
								cells.push(h('div', { key: 'b', className: 'line' },
									h('span', null, 'API 余额'),
									h('span', null, fb),
								));
							}
							return h('div', { key: prov.id, className: 'prov' }, cells);
						}),
				),
			);
		}

		function SettingsPage(props) {
			ensureCss();
			var _s = React.useState(null);
			var state = _s[0];
			var setState = _s[1];
			var _e = React.useState('');
			var err = _e[0];
			var setErr = _e[1];
			var _b = React.useState(false);
			var busy = _b[0];
			var setBusy = _b[1];

			var load = React.useCallback(function () {
				setBusy(true);
				api('/state').then(function (next) {
					setState(next);
					setErr('');
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}, []);

			React.useEffect(function () {
				load();
			}, [load]);

			function toggle(id, enabled) {
				setBusy(true);
				api('/toggle', { method: 'POST', body: JSON.stringify({ id: id, enabled: enabled }) }).then(function (body) {
					setState(body.state);
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			function applyNew(provider) {
				var row = (state.providers || []).find(function (p) { return p.id === provider; });
				if (!row) return;
				var models = (row.discovered || []).filter(function (m) { return m.isNew; }).map(function (m) { return { id: m.id, name: m.name }; });
				if (!models.length) return;
				setBusy(true);
				api('/apply', { method: 'POST', body: JSON.stringify({ provider: provider, models: models }) }).then(function (body) {
					setState(body.state);
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			return h('div', { className: 'msync-page' },
				h('h2', null, '模型同步'),
				h('p', { className: 'lead' }, '从各提供方 /models 抓取新模型并写入 settings。额度圆环：内环 5 小时、外环 7 天；没有公开窗口接口的提供方会显示原因。'),
				err ? h('p', { className: 'msync-err' }, err) : null,
				h('div', { className: 'msync-card' },
					h('div', { className: 'msync-row' },
						h('div', null, h('div', { className: 'name' }, '插件启停'), h('div', { className: 'hint' }, '写入 cordis.patch.yml 的 disabled 标志，热生效')),
						h('button', { className: 'msync-btn', disabled: busy, onClick: load }, busy ? '刷新中' : '刷新'),
					),
					(state && state.plugins ? state.plugins : []).map(function (plugin) {
						return h('div', { key: plugin.id, className: 'msync-row' },
							h('div', null, h('div', { className: 'name' }, plugin.label), h('div', { className: 'hint' }, plugin.id)),
							h('input', {
								className: 'msync-switch',
								type: 'checkbox',
								checked: plugin.enabled,
								disabled: busy,
								onChange: function (ev) { toggle(plugin.id, ev.target.checked); },
							}),
						);
					}),
				),
				(state && state.providers ? state.providers : []).map(function (provider) {
					var news = (provider.discovered || []).filter(function (m) { return m.isNew; });
					return h('div', { key: provider.id, className: 'msync-card' },
						h('div', { className: 'msync-row' },
							h('div', null,
								h('div', { className: 'name' }, provider.id),
								h('div', { className: 'hint' }, provider.baseURL || '无 baseURL'),
							),
							h('button', {
								className: 'msync-btn primary',
								disabled: busy || news.length === 0,
								onClick: function () { applyNew(provider.id); },
							}, news.length ? ('应用 ' + news.length + ' 个新模型') : '无新模型'),
						),
						h('div', { className: 'msync-models' },
							(provider.discovered || []).map(function (model) {
								return h('span', { key: model.id, className: 'msync-chip' + (model.isNew ? ' new' : '') }, model.id);
							}),
						),
						provider.lastError ? h('p', { className: 'msync-err' }, provider.lastError) : null,
						provider.quota && provider.quota.reason && provider.quota.reason !== provider.lastError
							? h('p', { className: 'hint' }, provider.quota.reason)
							: null,
						provider.quota && formatBalance(provider.quota.balance)
							? h('p', { className: 'hint' }, 'API 余额：' + formatBalance(provider.quota.balance))
							: null,
					);
				}),
			);
		}

		var pluginCtx;
		function RingSeat(props) {
			ensureCss();
			var sessionId = props.sessionId || (props.session && props.session.sessionId);
			var _s = React.useState(null);
			var state = _s[0];
			var setState = _s[1];
			var _sel = React.useState(null);
			var selection = _sel[0];
			var setSelection = _sel[1];
			React.useEffect(function () {
				var alive = true;
				function tick() {
					api('/state').then(function (next) { if (alive) setState(next); }).catch(function () {});
				}
				tick();
				var timer = setInterval(tick, 60000);
				return function () { alive = false; clearInterval(timer); };
			}, []);
			React.useEffect(function () {
				var dirs = pluginCtx && pluginCtx.get('modelDirectories');
				if (!dirs || !sessionId) return;
				var dir;
				try { dir = dirs.directoryFor(sessionId); } catch (e) { return; }
				function pull() {
					var snap = dir.store.getSnapshot();
					var cur = snap && snap.current;
					setSelection(cur && cur.provider ? { provider: cur.provider, model: cur.model } : null);
				}
				pull();
				if (typeof dir.load === 'function') dir.load().catch(function () {});
				return dir.store.subscribe(pull);
			}, [sessionId]);
			var all = (state && state.providers) || [];
			var filtered = [];
			if (selection && selection.provider) {
				for (var i = 0; i < all.length; i++) if (all[i].id === selection.provider) filtered.push(all[i]);
			}
			return h(DualRing, {
				providers: filtered,
				provider: selection && selection.provider,
				model: selection && selection.model,
				hint: selection ? undefined : '尚未识别当前会话模型',
			});
		}

		var inject = ['slots'];
		function apply(ctx) {
			pluginCtx = ctx;
			ensureCss();
			var slots = ctx.get('slots');
			if (slots === undefined) return;
			slots.inject('settings.section', function () {
				return slots.register({
					name: 'settings.section',
					id: 'model-sync',
					order: 16,
					label: '模型同步',
				}, SettingsPage);
			});
			slots.inject('settings.plugins.tab', function () {
				return slots.register({
					name: 'settings.plugins.tab',
					id: 'model-sync',
					order: 20,
					label: '模型同步',
				}, SettingsPage);
			});
			slots.inject('settings.plugin.item', function () {
				return slots.register({
					name: 'settings.plugin.item',
					id: 'model-sync-card',
					order: 40,
					label: '模型同步',
				}, SettingsPage);
			});
			slots.inject('conversation.input.right', function () {
				return slots.register({
					name: 'conversation.input.right',
					id: 'model-sync-quota',
					order: 20,
					label: '额度',
				}, RingSeat);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
