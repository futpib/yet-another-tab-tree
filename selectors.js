
const S = require('sanctuary');

const { createSelector } = require('reselect');

const getTabsForWindowId = windowId => createSelector(
	s => s.tabs,
	S.filter(tab => tab.windowId === windowId),
);

const tabToTreeNode = tab => ({ tab, childNodes: [] });

const getTree = (tabs, nesting) => {
	const roots = {};
	const handledTabs = {};
	const handleTab = tab => {
		let node = handledTabs[tab.id];
		if (node) {
			return node;
		}
		node = tabToTreeNode(tab);
		handledTabs[tab.id] = node;

		const parentTabId = nesting[tab.id];
		const parentTab = tabs[parentTabId];
		if (!parentTab) {
			roots[tab.id] = node;
			return node;
		}
		const parentNode = handledTabs[parentTabId] || handleTab(parentTab);

		parentNode.childNodes.push(node);
		return node;
	};

	S.values(tabs).forEach(handleTab);
	return S.values(roots);
};

const getTabsTreeForWindowId = windowId => {
	const getTabs = getTabsForWindowId(windowId);

	return createSelector(
		getTabs,
		s => s.nesting,
		getTree,
	);
};

module.exports = {
	getTabsForWindowId,
	getTabsTreeForWindowId,
};
