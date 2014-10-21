/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

document.title = "Infrastructure Event Tests";
Ether.Bootstrap.loadSources(
	{ module: 'Infrastructure' },
	function()
	{
		// utilsTests();
		// registryTests();
		eventTests();
		// registrarTests();
	});

function eventTests()
{
	var handlers,
		results,
		yme			= Ether.Event,
		on			= yme.on,
		once		= yme.once,
		fire		= yme.fire,
		fireAsync	= yme.fireAsync,
		off			= yme.off,
		onChange	= yme.onChange,
		offChange	= yme.offChange,
		onDeepChange	= yme.onDeepChange,
		offDeepChange	= yme.offDeepChange;

    module('Event');

	test('Events with notification object', onOffWithObject);

	//test('Events with nested notification object', onOffWithNestedObject);

/*	test('Once with notification object', onceWithObject);
	
	asyncTest('Events with notification function', onOffFunction);
	asyncTest('Less common uses of on/once/off', onOffObject2);
	asyncTest('Incorrect common uses of on/once/off', onOffWrong);
*/
	test('Change events with notification object', changeEventsObject);

	test('Change events with notification function', changeEventsFunction);

	test('Deep change notifications', deepChangeNotifications);
	
/*	asyncTest('Change events on an array', arrayChange);
	asyncTest('Add/remove events on an array', arrayChange2);

	asyncTest('Change events on elements in an array', elementChange);

	asyncTest('Other stuff (hold events, add events)', misc);

	asyncTest('Read only objects', readOnly);

	asyncTest('Performance', perf);
*/
	// on/fire/off
	// Check for normal, simple use of the API.
	function onOffWithObject()
	{
		var o1 = { },
			o2 = { };

		getHandlers(2, 3);

		// fire
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0 } );
		
		// on, fire
		on(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 1, evt2: 2, evt3: 0 } );

		// off, fire
		off(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0 } );

		// on, off, fire
		on(o1, handlers[0]);
		off(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0 } );

		// on, off, on, fire
		on(o1, handlers[0]);
		off(o1, handlers[0]);
		on(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 1, evt2: 2, evt3: 0 } );
		o1 = { };

		// on, off, on, off, fire
		on(o1, handlers[0]);
		off(o1, handlers[0]);
		on(o1, handlers[0]);
		off(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0 } );

		// on, on, on, fire
		on(o1, handlers[0]);
		on(o1, handlers[0]);
		on(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		checkResult(0, { evt1: 3, evt2: 6, evt3: 0 } );
		
		// fire unsubscribed events
		fire(o1, 'no_evt');
		fire(o2, 'evt1');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0 } );

		// on, add handler, fire
		o1 = { };
		on(o1, handlers[0]);

		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		handlers[0].evt4 = function() { results[0].evt4++; };
		results[0].evt4 = 0;
		fire(o1, 'evt4');
		checkResult(0, { evt1: 1, evt2: 2, evt3: 0, evt4: 1 } );
		
		// on, remove handler, fire
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt2');
		delete handlers[0].evt4;
		fire(o1, 'evt4');
		checkResult(0, { evt1: 1, evt2: 2, evt3: 0, evt4: 0 } );

		// fire events to two handlers
		on(o1, handlers[1]);
		delete handlers[0].evt3;
		delete handlers[1].evt3;
		delete handlers[1].evt2;
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt3');
		checkResult(0, { evt1: 1, evt2: 1, evt3: 0, evt4: 0 } );
		checkResult(1, { evt1: 1, evt2: 0, evt3: 0 } );

		// unsubscribe one handler
		off(o1, handlers[0]);
		fire(o1, 'evt1');
		fire(o1, 'evt2');
		fire(o1, 'evt3');
		checkResult(0, { evt1: 0, evt2: 0, evt3: 0, evt4: 0 } );
		checkResult(1, { evt1: 1, evt2: 0, evt3: 0 } );
	}

	function onOffWithNestedObject()
	{
		var o =
			{
				m1:
				{
					a: 1
				},
				m2:
				{
					b: 5
				}
			},
			notify =
			{
				m1:
				{
					a: function(fullName, oldVal, sub, name)
						{
							equal(this, o);
							equal(fullName, 'm1.a');
							equal(oldVal, 1);
							equal(sub, this.m1);
							equal(name, 'a');
							equal(sub[name], 6);
							equal(this.m1.a, 6);
						}
				},
				m2:
				{
					b: function(fullName, oldVal, sub, name)
						{
							equal(this, o);
							equal(fullName, 'm2.b');
							equal(oldVal, 5);
							equal(sub, this.m2);
							equal(name, 'b');
							equal(sub[name], 7);
							equal(this.m2.b, 7);
						}
				}
			};

		expect(14);

		onChange(o, notify);

		o.m1.a = 6;
		o.m2.b = 7;

		offChange(o, notify);

		o.m1.a = 7;
		o.m2.b = 9;
	}

	function onceWithObject()
	{
	}
	
	function onOffObject2()
	{
		var o1 = { },
			f1 = function() { },
			s1 = 'string one';

		// You can subscribe to events on any non-falsey value
		//on(f1,

	}

	function onOffWrong()
	{
		var o1 = { },
			f1 = function() { },
			s1 = 'string one';

		// It only makes sense to fire strings?
		fire(f1, f1);
		fire(o1);
	}

	// on/once/fire/off
	function onOffFunction()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	// onChange/oneChange/offChange
	function changeEventsObject()
	{
		var o1 = { a: 1, b: 2 },
			n1 = 
			{
				a: function()
				{
					console.log(arguments);
					ok(1, 'OK');
				},
				b: function()
				{
					console.log(arguments);
					ok(1, 'OK');
				}
			};

		onChange(o1, n1);
		o1.a = 2;
		o1.b++;
		offChange(o1, n1);
	}

	// onChange/offChange
	function changeEventsFunction()
	{
		var cleanup, expectedName, expectedVal, expectedOldVal, received,
			o1 = { a: 1, b: 2, c: 3 },
			o2 = { a: 4, b: 5, c: 6 };
		
		// offChange, change
		received = 0;
		offChange(o1, verify);
		o1.a = 2;
		equal(received, 0);
		
		// onChange, change
		reset();
		onChange(o1, verify);
		received = 0;
		expectedName = 'a';
		expectedVal = 3;
		expectedOldVal = 1;
		o1.a = 3;
		equal(received, 1);

		// onChange, change, change
		reset();
		received = 0;
		expectedName = 'a';
		expectedVal = 3;
		expectedOldVal = 1;
		o1.a = 3;
		expectedVal = 4;
		expectedOldVal = 3;
		o1.a++;
		equal(received, 2);

		// onChange, no change
		reset();
		received = 0;
		o1.a = 1;
		equal(received, 0);
		
		// onChange, no change, change
		reset();
		received = 0;
		o1.a = 1;
		expectedName = 'a';
		expectedVal = 2;
		expectedOldVal = 1;
		o1.a = 2;
		equal(received, 1);

		// onChange, change, no change, change

		// onChange, offChange, change
		reset();
		offChange(o1, verify);
		o1.a++;
		o1.b++;
		equal(received, 0);
		
		// onChange, offChange, onChange, change
		
		// onChange, onChange, offChange, change

		// onChange, offChange, offChange, change
		
		// onChange o1, onChange o2, change
	
		reset();
		onChange(o1, verify);
		onChange(o2, verify);
		expectedName = 'a';
		expectedVal = 3;
		expectedOldVal = 1;
		o1.a = 3;
		equal(received, 1);
		
		expectedName = 'a';
		expectedVal = 3;
		expectedOldVal = 4;
		o2.a = 3;
		equal(received, 2);

		reset();
		offChange(o1, verify);
		o1.a = 3;
		equal(received, 0);
		
		expectedName = 'a';
		expectedVal = 3;
		expectedOldVal = 4;
		o2.a = 3;
		equal(received, 1);
		
		reset();
		offChange(o2, verify);
		o1.a = 3;
		o2.a = 3;
		o1.a++;
		o2.a++;
		equal(received, 0);

		function verify(name, oldVal, phase)
		{
			if (!cleanup)
			{
				equal(name, expectedName);
				equal(oldVal, expectedOldVal);
				equal(this[name], expectedVal);
				received++;
			}
		}
		
		function reset()
		{
			received = 0;
			cleanup = 1;
			o1.a = 1;
			o1.b = 2;
			o1.c = 3;
			o2.a = 4;
			o2.b = 5;
			o2.c = 6;
			cleanup = 0;
		}
		
	}

	///////////////////////////////////////////////////////////////
	function deepChangeNotifications()
	{
		var expectedType, expectedMember, expectedOldVal,
			newVal, verified,
			o =
			{
				m:
				{
					n:
					{
						p:	7
					}
				}
			},
			n = { p: 7 },
			a = [ 0, 1 ],
			oldM = o.m;

		onDeepChange(o, verify);
		expectedType = 'change';
		expectedMember = 'p';
		expectedOldVal = o.m.n.p;
		newVal = 6;
		o.m.n.p = newVal;

		expectedMember = 'n';
		expectedOldVal = o.m.n;
		newVal = n;
		o.m.n = newVal;

		expectedMember = 'p';
		expectedOldVal = o.m.n.p;
		newVal = 6;
		o.m.n.p = newVal;

		expectedMember = 'm';
		expectedOldVal = oldM;
		newVal = a;
		o.m = newVal;

		expectedType = 'push';
		a.push('test', 'test2');

		expectedType = 'pop';
		a.pop();

		verified = false;
		expectedType = 'change';
		expectedMember = 'none';
		oldM.n.p = 6;
		equal(verified, false);

		offDeepChange(o, verify);

		function verify(type, member, oldVal)
		{
			verified = true;

			equal(type, expectedType);
			if (type == 'change')
			{
				equal(member, expectedMember);
				equal(oldVal, expectedOldVal);
				equal(this[member], newVal);
			}
			else
				equal(true, this instanceof Array);
		}
	}

	// onArrayChange/onArrayChanging/offArrayChange/offArrayChanging
	function arrayChange()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	// onElementAdding/onElementRemoved/offElementAdding/offElementRemoved
	function arrayChange2()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	// onElementChange/offElementChange
	function elementChange()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	// addEvents/holdEvents/releaseEvents
	function misc()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	// readOnly/readOnlyArray/readWrite/readWriteArray
	function readOnly()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	function perf()
	{
		expect(2);

		ok(1, 'First OK');
		ok(1, 'Second OK');

		start();
	}

	function checkResult(idx, expected)
	{
		var name;
		for (name in expected)
		{
			equal(results[idx][name], expected[name], name);
			results[idx][name] = 0;
		}

		for (name in results[idx])
		{
			if (!expected.hasOwnProperty(name))
				equal(results[idx][name], 0, name);
		}
	}
	
	function getHandlers(numHandlers, numEvents)
	{
		handlers = [ ];
		results = [ ];
		
		var handler, result, name, i;
		
		while (numHandlers--)
		{
			handler = { };
			handlers.push(handler);
			result = { };
			results.push(result);
			
			for (i = 1; i <= numEvents; i++)
			{
				name = 'evt' + i;
				result[name] = 0;
				handler[name] =
					(function getHandler(result, name)
					{
						return function()
								{
									result[name]++;
								};
					})(result, name);
			}
		}
	}
}
