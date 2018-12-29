
import test from 'ava';

import { getTabsTreeForWindowId } from './selectors';

const macro = (t, tabs, nesting, expected) => {
	const actual = getTabsTreeForWindowId(1)({ tabs, nesting });
	t.deepEqual(actual, expected);
};

test(macro, {
	1: { id: 1, windowId: 1 },
	2: { id: 2, windowId: 1 },
	3: { id: 3, windowId: 1 },
	101: { id: 101, windowId: 2 },
}, {
	2: 1,
	3: 1,
}, [
	{
		tab: { id: 1, windowId: 1 },
		childNodes: [
			{
				tab: { id: 2, windowId: 1 },
				childNodes: [],
			},
			{
				tab: { id: 3, windowId: 1 },
				childNodes: [],
			},
		],
	},
]);
