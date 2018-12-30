
const { createActions: createActionCreators } = require('redux-actions');

module.exports = createActionCreators({
	tabs: {
		created: tab => ({ tab }),
		updated: (tabId, changeInfo, tab) => ({ tabId, changeInfo, tab }),
		activated: activeInfo => ({ activeInfo }),
		highlighted: highlightInfo => ({ highlightInfo }),
		moved: (tabId, moveInfo) => ({ tabId, moveInfo }),
		removed: (tabId, removeInfo) => ({ tabId, removeInfo }),

		attached: (tabId, attachInfo) => ({ tabId, attachInfo }),
		detached: (tabId, detachInfo) => ({ tabId, detachInfo }),

		update: (tabId, updateProperties) => ({ tabId, updateProperties }),
		move: (tabIds, moveProperties) => ({ tabIds, moveProperties }),
	},

	collapsed: {
		toggleCollapsed: null,
	},

	nesting: {
		setParent: null,
	},

	drag: {
		dragOver: null,
		dragLeave: null,
	},
});
