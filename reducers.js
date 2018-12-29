
const S = require('sanctuary');

const { combineReducers } = require('redux');
const { handleActions } = require('redux-actions');

const actions = require('./actions');

const initialState = {
	tabs: {},
	nesting: {}, // Map ChildTabId ParentTabId
	collapsed: {},
};

const reducer = combineReducers({
	tabs: handleActions({
		[actions.tabs.created]: (state, { payload: { tab } }) => S.insert(String(tab.id))(tab)(state),
		[actions.tabs.updated]: (state, { payload: { tab } }) => S.insert(String(tab.id))(tab)(state),
		[actions.tabs.activated]: (state, { payload: { activeInfo: { windowId, tabId } } }) =>
			S.map(tab => {
				if (tab.windowId !== windowId) {
					return tab;
				}
				const active = tabId === tab.id;
				if (tab.active === active) {
					return tab;
				}
				return Object.assign({}, tab, { active });
			})(state),
		[actions.tabs.highlighted]: (state, { payload: { highlightInfo: { windowId, tabIds } } }) =>
			S.map(tab => {
				if (tab.windowId !== windowId) {
					return tab;
				}
				const highlighted = tabIds.includes(tab.id);
				if (tab.highlighted === highlighted) {
					return tab;
				}
				return Object.assign({}, tab, { highlighted });
			})(state),
		[actions.tabs.removed]: (state, { payload: { tabId } }) => S.remove(String(tabId))(state),
	}, initialState.tabs),

	nesting: handleActions({
		[actions.tabs.created]: (state, { payload: { tab } }) => {
			if (tab.openerTabId === undefined) {
				return state;
			}
			return S.insert(String(tab.id))(tab.openerTabId)(state);
		},
		[actions.tabs.removed]: (state, { payload: { tabId } }) => S.pipe([
			S.remove(String(tabId)),
			S.filter(parentTabId => parentTabId !== tabId),
		])(state),
	}, initialState.nesting),

	collapsed: handleActions({
		[actions.tabs.toggleCollapsed]: (state, { payload: { tabId } }) =>
			S.insert(String(tabId))(!state[tabId])(state),
	}, initialState.collapsed),
});

module.exports = {
	reducer,
	initialState,
};
