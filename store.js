/* global browser */

const { createStore: createStore_, applyMiddleware } = require('redux');

const actions = require('./actions');
const { reducer, initialState } = require('./reducers');

function tabsMiddleware({ dispatch, getState }) {
	const addDispatchListener = (event, actionCreator) => {
		const handler = (...args) => dispatch(actionCreator(...args));
		event.addListener(handler);
		return handler;
	};

	const onCreated = addDispatchListener(browser.tabs.onCreated, actions.tabs.created);
	addDispatchListener(browser.tabs.onUpdated, actions.tabs.updated);
	addDispatchListener(browser.tabs.onActivated, actions.tabs.activated);
	addDispatchListener(browser.tabs.onHighlighted, actions.tabs.highlighted);
	addDispatchListener(browser.tabs.onRemoved, actions.tabs.removed);

	addDispatchListener(browser.tabs.onAttached, actions.tabs.attached);
	addDispatchListener(browser.tabs.onDetached, actions.tabs.detached);

	(async () => {
		const tabs = await browser.tabs.query({});
		tabs.forEach(onCreated);
	})();

	return next => action => {
		// console.log(action, getState());

		if (action.type === String(actions.tabs.update)) {
			const { tabId, updateProperties } = action.payload;
			browser.tabs.update(tabId, updateProperties);
		}

		return next(action);
	};
}

function createStore() {
	const middlewares = [
		tabsMiddleware,
	];
	return createStore_(reducer, initialState, applyMiddleware(...middlewares));
}

module.exports = {
	createStore,
};
