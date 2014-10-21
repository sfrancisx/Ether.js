/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

window.Ether = window.Ether || { };

Ether.registry = function()
{
	"use strict";

	var registry = { keys: [] };

	return {
			get:			get,
			check:			check,
			remove:			remove
			};

	function check(/*, key1, key2... */)
	{
		var key, idx,
			args	= arguments,
			current = registry,
			i		= 0;

		// For get, check & remove, use the same arbitrary object when no arguments are passed in, to
		// allow registration without any keys
		if (!args.length)
			args = [ check ];

		while (i < args.length)
		{
			key = idx = args[i++];
			if (typeof key != 'string')
				idx = current.keys.indexOf(key);

			if (i == args.length)
				return current.values && current.values[idx];

			current = current.subs && current.subs[idx];
			if (!current)
				return 0;
		}
	}

	function remove(/*, key1, key2... */)
	{
		var args = arguments;

		// For get, check & remove, use the same arbitrary object when no arguments are passed in, to
		// allow registration without any keys
		if (!args.length)
			args = [ check ];
		
		return removeAt(0, registry);

		function removeAt(i, current)
		{
			var subs, retVal,
				key = args[i],
				idx = key;
			
			if (typeof key != 'string')
			{
				idx = current.keys.indexOf(key);

				if (!current.keys[idx])
					return;
			}
			
			subs = current.subs;
			
			if (i == args.length - 1)
				retVal = trim(current.values, idx);
			else if (subs && subs[idx])
				retVal = removeAt(i+1, subs[idx]);

			if (subs && subs[idx])
			{
				if (!subs[idx].keys.length && !Object.keys(subs[idx].keys).length)
					trim(current.subs, idx);
			}

			if ((!current.values || !current.values[idx]) && (!current.subs || !current.subs[idx]))
			{
				current.keys.splice(idx, 1);
				if (current.values)
					current.values.splice(idx, 1);
				if (current.subs)
					current.subs.splice(idx, 1);
			}

			return retVal;
		}
	}

	function trim(a, idx)
	{
		var retVal;
		
		if (a)
		{
			retVal = a[idx];
			a[idx] = 0;

			if (typeof idx != 'string')
			{
				while ((idx == a.length - 1) && !a[idx--])
					a.pop();
			}
		}
		
		return retVal;
	}

	function get(/*, key1, key2... */)
	{
		var key, idx, values, subs,
			args	= arguments,
			current = registry,
			i		= 0;

		// For get, check & remove, use the same arbitrary object when no arguments are passed in, to
		// allow registration without any keys
		if (!args.length)
			args = [ check ];

		while (i < args.length)
		{
			/*
			key = args[i++];
			idx = current.keys.indexOf(key);
			if (idx == -1)
				idx = current.keys.push(key) - 1;
			*/

			// I could do this to special case string keys, but it complicates removal
			key = idx = args[i++];
			if (typeof key != "string")
			{
				idx = current.keys.indexOf(key);
				if (idx == -1)
					idx = current.keys.push(key) - 1;
			}

			if (i == args.length)
			{
				values = current.values = current.values || [];
				return (values[idx] = values[idx] || {});
			}

			subs = current.subs = current.subs || [];
			current = subs[idx] = subs[idx] || { keys: [] };
		}
	}
};
