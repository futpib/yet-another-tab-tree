/* global browser, window */

const S = require('sanctuary');

const { Component, render, createRef } = require('inferno');
const { Provider, connect } = require('inferno-redux');
const r = require('inferno-r-dom');

const { bindActionCreators } = require('redux');

const { createStore } = require('./store');
const {
	getTabsTreeForWindowId,
} = require('./selectors');
const {
	tabs: {
		move,
		update,
	},

	collapsed: {
		toggleCollapsed,
	},

	nesting: {
		setParent,
	},

	drag: {
		dragOver,
		dragLeave,
	},
} = require('./actions');

const dragFormatNamespace = s => 'github.com/futpib/yet-another-tab-tree#' + s;
const DRAG_FORMAT_DRAGGED_TAB_ID = dragFormatNamespace('draggedTabId');

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
		return this.props.children(windowId);
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
}, S.pipe([
	S.sortBy(S.props([ 'tab', 'index' ])),
	S.map(node => r(TreeNode, { key: node.tab.id, node })),
])(childNodes));

const TreeNode = connect(
	(state, { node: { tab } }) => ({
		collapsed: state.collapsed[tab.id],
	}),
)(class TreeNode_ extends Component {
	constructor(props) {
		super(props);

		this.ref = createRef();
	}

	render() {
		const { node: { tab, childNodes }, collapsed } = this.props;

		return r.div({
			ref: this.ref,
			className: 'tree-node',
		}, [
			r(TreeTab, {
				nodeRef: this.ref,
				tab,
				collapsed,
				hasChildNodes: childNodes.length > 0,
			}),
			!collapsed && r(TreeChildNodes, { childNodes }),
		]);
	}
});

const workaround = c => props => r(c, props);

const TreeTab = connect(
	({ drag: { targetTabId, targetTabIsHovered, targetInsertionMode }, tabs, nesting }) => ({
		targetTab: tabs[targetTabId],
		targetTabParentId: nesting[targetTabId],
		targetTabIsHovered,
		targetInsertionMode,
	}),
	dispatch => bindActionCreators({
		move,
		update,

		setParent,

		dragOver,
		dragLeave,
	}, dispatch),
)(workaround(class TreeTab_ extends Component {
	constructor(props) {
		super(props);

		this.ref = createRef();

		this.state = {};
	}

	static getDerivedStateFromProps(props) {
		return {
			dragVerticalSplits: props.hasChildNodes ?
				[ 'after' ] :
				[ 'into', 1 / 2, 'after' ],
		};
	}

	getInsertionMode(e) {
		const { clientY } = e;
		const { offsetTop, offsetHeight } = this.ref.current;
		const y = (clientY - offsetTop) / offsetHeight;

		let dragovered = null;
		for (const a of this.state.dragVerticalSplits) {
			if (typeof a === 'number') {
				if (a > y) {
					break;
				}
			} else {
				dragovered = a;
			}
		}

		return dragovered;
	}

	render() {
		const {
			nodeRef,
			tab,
			collapsed,
			hasChildNodes,

			targetTab,
			targetTabIsHovered,
			targetTabParentId,
			targetInsertionMode,

			update,
			move,

			setParent,

			dragOver,
			dragLeave,
		} = this.props;

		const isDragTarget = targetTab === tab;

		return r.div({
			ref: this.ref,
			classSet: {
				'tree-tab': true,
				'tree-tab-active': tab.active,
				'tree-tab-attention': tab.attention,
				[`tree-tab-dragovered-${targetInsertionMode}`]: isDragTarget && targetTabIsHovered,
			},
			draggable: true,
			onClick: () => update(tab.id, { active: true }),

			onDragStart: e => {
				const image = hasChildNodes ? nodeRef.current : this.ref.current;
				e.dropEffect = 'move';
				e.dataTransfer.setData(DRAG_FORMAT_DRAGGED_TAB_ID, tab.id);
				e.dataTransfer.setDragImage(image, 0, 0);
			},
			onDragEnd: e => {
				const tabId = e.dataTransfer.getData(DRAG_FORMAT_DRAGGED_TAB_ID);
				if (!tabId) {
					return;
				}
				if (!targetTab) {
					return;
				}
				if (targetInsertionMode === 'into') {
					setParent({
						tabId: tab.id,
						parentTabId: targetTab.id,
					});
					move(tab.id, {
						index: targetTab.index + 1,
						windowId: tab.windowId,
					});
				} else if (targetInsertionMode === 'after') {
					setParent({
						tabId: tab.id,
						parentTabId: targetTabParentId,
					});
					move(tab.id, {
						index: targetTab.index + 1,
						windowId: tab.windowId,
					});
				}
			},

			onDragOver: e => {
				const tabId = e.dataTransfer.getData(DRAG_FORMAT_DRAGGED_TAB_ID);
				if (!tabId) {
					return;
				}
				const insertionMode = this.getInsertionMode(e);
				dragOver({ tabId: tab.id, insertionMode });
			},
			onDragLeave: e => {
				const tabId = e.dataTransfer.getData(DRAG_FORMAT_DRAGGED_TAB_ID);
				if (!tabId) {
					return;
				}
				dragLeave({ tabId: tab.id });
			},
		}, [
			hasChildNodes && r(TreeTabCollapsed, { tabId: tab.id, collapsed }),
			r(TreeTabIcon, tab),
			r(TreeTabTitle, tab),
			r(TreeTabMuteButton, tab),
			r(TreeTabCloseButton, tab),
		]);
	}
}));

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
