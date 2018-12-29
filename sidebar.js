/* global browser, window */

const S = require('sanctuary');

const { Component, render } = require('preact');
const { Provider, connect } = require('preact-redux');
const r = require('preact-r-dom');

const { bindActionCreators } = require('redux');

const { createStore } = require('./store');
const { getTabsTreeForWindowId } = require('./selectors');
const {
	tabs: {
		update,
		toggleCollapsed,
	},
} = require('./actions');

const Root = () => r(Provider, {
	store: createStore(),
}, r(WindowIdProvider, {}, windowId => r(Tree, { windowId })));

class WindowIdProvider extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	async componentDidMount() {
		const window = await browser.windows.getCurrent();
		this.setState({ windowId: window.id });
	}

	render() {
		const { windowId } = this.state;
		if (!windowId) {
			return r.div();
		}
		return this.props.children[0](windowId);
	}
}

const Tree = connect(
	(state, { windowId }) => ({
		childNodes: getTabsTreeForWindowId(windowId)(state),
		root: true,
	}),
)(props => r(TreeChildNodes, props));

const TreeChildNodes = ({ childNodes, root }) => r.div({
	classSet: {
		'tree-child-nodes': true,
		'tree-child-nodes-root': root,
	},
}, S.map(node => r(TreeNode, { node }))(childNodes));

const TreeNode = connect(
	(state, { node: { tab } }) => ({
		collapsed: state.collapsed[tab.id],
	}),
)(({ node: { tab, childNodes }, collapsed }) => r.div({
	className: 'tree-node',
}, [
	r(TreeTab, { tab, collapsed, hasChildNodes: childNodes.length > 0 }),
	!collapsed && r(TreeChildNodes, { childNodes }),
]));

const TreeTab = connect(
	null,
	dispatch => bindActionCreators({
		update,
	}, dispatch),
)(({ tab, collapsed, hasChildNodes, update }) => r.div({
	classSet: {
		'tree-tab': true,
		'tree-tab-active': tab.active,
	},
	draggable: true,
	onClick: () => update(tab.id, { active: true }),
	onDragStart: e => {
		console.log(e);
		e.dataTransfer.setDragImage(e.target, 0, 0);
	},
}, [
	hasChildNodes && r(TreeTabCollapsed, { tabId: tab.id, collapsed }),
	r(TreeTabIcon, tab),
	r(TreeTabTitle, tab),
	r(TreeTabMuteButton, tab),
	r(TreeTabCloseButton, tab),
]));

const TreeTabCollapsed = connect(
	null,
	dispatch => bindActionCreators({
		toggleCollapsed,
	}, dispatch),
)(({ tabId, collapsed, toggleCollapsed }) => r.span({
	className: 'tree-tab-collapsed',
	onClick: () => toggleCollapsed({ tabId }),
}, collapsed ? '▸' : '▾'));

const TreeTabIcon = ({ favIconUrl }) => r.img({
	className: 'tree-tab-icon',
	src: favIconUrl,
	isRendered: favIconUrl,
});

const TreeTabTitle = ({ title }) => r.span({
	className: 'tree-tab-title',
}, title);

const TreeTabMuteButton = ({
	audible, mutedInfo: { muted },
}) => r.div({
	classSet: {
		'tree-tab-button': true,
		'tree-tab-mute-button': true,
		'tree-tab-mute-button-audible': audible,
		'tree-tab-mute-button-muted': muted,
	},
});

const TreeTabCloseButton = () => r.div({
	className: 'tree-tab-button tree-tab-close-button',
});

render(r(Root), window.document.getElementById('content'));
