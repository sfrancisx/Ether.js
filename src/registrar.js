/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * An action registrar.  All actions performed through a registrar can be cleaned up with
 * `registrar.cleanup()`.
 *
 * Example:
 *
 *		var registrar = Ether.getRegistrar();
 *
 *		registrar.on(object1, handler1);
 *		registrar.addEventListener(el, 'click', onElClick);
 *		registrar.onChange(object2, changeHandler);
 *
 *		... Do your stuff ...
 *
 *		registrar.cleanup();		// Detaches all event handlers registered above
 *
 * I don't know why it would matter, but handlers will be removed in the reverse order in
 * which they were added.
 *
 * The corresponding `off` methods are exposed on the registrar.
 *
 * Example:
 *
 *		registrar.on(object1, handler1);
 *		registrar.addEventListener(el, 'click', onElClick);
 *		registrar.onChange(object2, changeHandler);
 *
 *		... Do some stuff ...
 *
 *		registrar.off(object1, handler1);
 *		registrar.removeEventListener(el, 'click', onElClick);
 *
 *		... Do some more stuff ...
 *
 *		registrar.cleanup();		// Detaches any remaining event handlers
 *
 * The registrar doesn't know anything about what it's registering.  If you turn off event
 * handlers outside the registrar, it won't know about it and it will try to do it again when
 * you call `cleanup()`.
 *
 * The registrar currently handles `Ether.Event` handlers and the DOM's `addEventListener()`,
 * but it should be easy to extend.
 *
 * @module Infrastructure
 * @namespace Ether
 * @class Registrar
 */

/**
 * Get a new registrar.
 *
 * @method getRegistrar
 * @return Registrar
 */

window.Ether = window.Ether || { };

(function(){

'use strict';
 
var r = createRegistrar();

Ether.getRegistrar = r.getRegistrar;
Ether.getRegistrar.cleanup = r.cleanup;

function createRegistrar()
{
	var registered = [ ],
		intf =
		{
			/**
			 * Execute and remove all cleanup actions
			 *
			 * This module creates a 'master' registrar - all other registrars are children of it.  That
			 * registrar's cleanup function is `Ether.getRegistrar.cleanup()`.  Calling that will clean up
			 * ALL registrars, so you probably don't want to do it.  You should only call cleanup on
			 * registrars that you have created.
			 * @method cleanup
			 *
			 * @example
			 *
			 *		var myRegistrar = Ether.getRegistrar();
			 *
			 *		... use myRegistrar ...
			 *
			 *		myRegistrar.cleanup();
			 */
			cleanup:		cleanup,

			/**
			 * Register any function to be called when the registrar is cleaned up
			 * @method register
			 * @param {object} t			The `this` pointer to use when calling the function
			 * @param {function|string} fn	The function (or the name of the function on `t`) to call
			 * @param {array} args			The arguments to pass to the function
			 *
			 * Registered functions cannot (currently) be executed or removed except by
			 * calling `cleanup()`.  It's possible to return an identifier and to add `unregister`
			 * and/or `execute` methods to remove registered actions.  (`unregister` could also be
			 * used to remove 'normal' actions without executing them.)
			 */
			register:		register,

			setTimeout:		registrarSetTimeout,
			
			/**
			 * Get a child registrar
			 *
			 * The cleanup action for a child registrar is to clean up that registrar.
			 * @method registrar
			 */
			getRegistrar:	getRegistrar
		},
		pairs =
		[
			/**
			 * `Ether.Event.on()`  See {{#crossLink "Ether.Event/on:method"}}{{/crossLink}}.
			 * @method on
			 */
			/**
			 * `Ether.Event.once()`
			 * @method once
			 */
			/**
			 * `Ether.Event.off()`
			 * @method off
			 */
			{ addAction: [ 'on', 'once' ], doAction: 'off', o: Ether.Event },
			/**
			 * `Ether.Event.onElement()`  See {{#crossLink "Ether.Event/onElement:method"}}{{/crossLink}}.
			 * @method onElement
			 */
			/**
			 * `Ether.Event.offElement()`
			 * @method offElement
			 */
			{ addAction: [ 'onElement' ], doAction: 'offElement', o: Ether.Event },
			/**
			 * `Ether.Event.onArrayChange()`
			 * @method onArrayChange
			 */
			/**
			 * `Ether.Event.offArrayChange()`
			 * @method offArrayChange
			 */
			{ addAction: [ 'onArrayChange' ], doAction: 'offArrayChange', o: Ether.Event },
			/**
			 * `Ether.Event.onArrayChanging()`
			 * @method onArrayChanging
			 */
			/**
			 * `Ether.Event.offArrayChanging()`
			 * @method offArrayChanging
			 */
			{ addAction: [ 'onArrayChanging' ], doAction: 'offArrayChanging', o: Ether.Event },
			/**
			 * `Ether.Event.onChange()`
			 * @method onChange
			 */
			/**
			 * `Ether.Event.offChange()`
			 * @method offChange
			 */
			/**
			 * `Ether.Event.oneChange()`
			 * @method oneChange
			 */
			{ addAction: [ 'onChange', 'oneChange' ], doAction: 'offChange', o: Ether.Event },
			/**
			 * `Ether.Event.onDeepChange()`
			 * @method onDeepChange
			 */
			/**
			 * `Ether.Event.offDeepChange()`
			 * @method offDeepChange
			 */
			{ addAction: [ 'onDeepChange' ], doAction: 'offDeepChange', o: Ether.Event },
			/**
			 * `Ether.Event.onElementAdding()`
			 * @method onElementAdding
			 */
			/**
			 * `Ether.Event.offElementAdding()`
			 * @method offElementAdding
			 */
			{ addAction: [ 'onElementAdding' ], doAction: 'offElementAdding', o: Ether.Event },
			/**
			 * `Ether.Event.onElementChange()`
			 * @method onElementChange
			 */
			/**
			 * `Ether.Event.offElementChange()`
			 * @method offElementChange
			 */
			{ addAction: [ 'onElementChange' ], doAction: 'offElementChange', o: Ether.Event },
			/**
			 * `Ether.Event.onElementRemoved()`
			 * @method onElementRemoved
			 */
			/**
			 * `Ether.Event.offElementRemoved()`
			 * @method offElementRemoved
			 */
			{ addAction: [ 'onElementRemoved' ], doAction: 'offElementRemoved', o: Ether.Event },

			/**
			 * `Ether.Event.onElementRemoved()`
			 * @method onElementRemoved
			 */
			/**
			 * `Ether.Event.offElementRemoved()`
			 * @method offElementRemoved
			 */
			{ addAction: [ 'synchronizeObject' ], doAction: 'unsynchronizeObject', o: Ether.IPC },

			// addEvents/removeEvents?
			// holdEvents/releaseEvents?

			/**
			 * DOM `addEventListener()`
			 * @method addEventListener
			 */
			/**
			 * DOM `removeEventListener()`
			 * @method removeEventListener
			 */
			{ addAction: [ 'addEventListener' ], doAction: 'removeEventListener' }
		];

	pairs.forEach(function(pair)
		{
			pair.addAction.forEach(
				function(name)
				{
					intf[name] = function() { return addAction(name, pair, arguments); };
				});
			intf[pair.doAction] = function() { return doAction(pair, arguments); };
		});

	return intf;

	function register(t, fn, args)
	{
		registered.push( { _this: t, fn: fn, args: args } );
	}
			
	function getRegistrar()
	{
		var r = createRegistrar();
		register(r, 'cleanup');
		return r;
	}

	function cleanup()
	{
		var action, fn;

		while (action = registered.pop())
		{
			fn = action.fn || action.pair.doAction;
			if (typeof fn != 'function')
				fn = action._this[fn];

			fn.apply(action._this, action.args);
		}
	}
	
	/**
	 * Browser `setTimeout()`
	 * @method setTimeout
	 */
	function registrarSetTimeout(fn, time)
	{
		var id = {};
		
		id.id = setTimeout(function()
			{
				id.id = 0;
				fn();
			}, time);

		register(0, function()
			{
				clearTimeout(id.id);
				id.id = 0;
			},
			id);
	}

	function addAction(name, pair, args)
	{
		var t = pair.o;

		if (!t)
		{
			t = args[0];
			args = Array.prototype.slice.call(args, 1);
		}

		registered.push( { pair: pair, _this: t, args: args } );

		return t[name].apply(t, args);
	}
	
	function doAction(pair, args)
	{
		var i, action, j, match,
			t = pair.o;

		if (!t)
		{
			t = args[0];
			args = Array.prototype.slice.call(args, 1);
		}

		for (i = 0; i < registered.length; i++)
		{
			action = registered[i];
			if (action.pair == pair)
			{
				if (action._this == t)
				{
					match = 1;
					for (j = 0; j < args.length; j++)
					{
						if (args[j] != action.args[j])
						{
							match = 0;
							break;
						}
					}
					if (match)
					{
						registered.splice(i, 1);
						return t[pair.doAction].apply(t, args);
					}
				}
			}
		}
	}
}

})();
