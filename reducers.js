
const S = require('sanctuary');

const { combineReducers } = require('redux');
const { handleActions } = require('redux-actions');

const actions = require('./actions');

const initialState = {
	tabs: {},
	nesting: {}, // Map ChildTabId ParentTabId
	collapsed: {},
	drag: {
		targetTabId: null,
		targetTabIsHovered: false,
		targetInsertionMode: null,
	},
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
		[actions.tabs.moved]: (state, { payload: { tabId, moveInfo: { windowId, fromIndex, toIndex } } }) =>
			S.map(tab => {
				if (tab.windowId !== windowId) {
					return tab;
				}
				if (tab.id === tabId) {
					return Object.assign({}, tab, { index: toIndex });
				}
				if (fromIndex < toIndex) {
					if (fromIndex < tab.index && tab.index <= toIndex) {
						return Object.assign({}, tab, { index: tab.index - 1 });
					}
				} else if (toIndex < fromIndex) {
					if (toIndex <= tab.index && tab.index < fromIndex) {
						return Object.assign({}, tab, { index: tab.index + 1 });
					}
				}
				return tab;
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

		[actions.nesting.setParent]: (state, { payload: { tabId, parentTabId } }) =>
			(
				parentTabId ?
					S.insert(String(tabId))(parentTabId) :
					S.remove(String(tabId))
			)(state),
	}, initialState.nesting),

	collapsed: handleActions({
		[actions.tabs.toggleCollapsed]: (state, { payload: { tabId } }) =>
			S.insert(String(tabId))(!state[tabId])(state),
	}, initialState.collapsed),

	drag: handleActions({
		[actions.drag.dragOver]: (state, { payload: { tabId, insertionMode } }) => ({
			targetTabId: tabId,
			targetTabIsHovered: true,
			targetInsertionMode: insertionMode,
		}),
		[actions.drag.dragLeave]: (state, { payload: { tabId } }) => {
			if (state.targetTabId === tabId) {
				return Object.assign({}, state, { targetTabIsHovered: false });
			}
			return state;
		},
	}, initialState.drag),
});

module.exports = {
	reducer,
	initialState,
};
