export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.rG3oScDn.js",app:"_app/immutable/entry/app.CeHvaVFU.js",imports:["_app/immutable/entry/start.rG3oScDn.js","_app/immutable/chunks/CPP4IkTN.js","_app/immutable/chunks/BjXirPMm.js","_app/immutable/chunks/4qPAcQrJ.js","_app/immutable/chunks/B_o1Vd1k.js","_app/immutable/chunks/DtZmAio6.js","_app/immutable/chunks/2exEndS9.js","_app/immutable/chunks/DpuDGJF3.js","_app/immutable/entry/app.CeHvaVFU.js","_app/immutable/chunks/BjXirPMm.js","_app/immutable/chunks/4qPAcQrJ.js","_app/immutable/chunks/B_o1Vd1k.js","_app/immutable/chunks/DtZmAio6.js","_app/immutable/chunks/2exEndS9.js","_app/immutable/chunks/DpuDGJF3.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/events",
				pattern: /^\/events\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/flows",
				pattern: /^\/flows\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/knowledge",
				pattern: /^\/knowledge\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/planner",
				pattern: /^\/planner\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/viewport",
				pattern: /^\/viewport\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
