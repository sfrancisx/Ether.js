/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

window.Ether = window.Ether || { };

(function()
{
"use strict";

var moduleGroup, fileGroup, req, config,
	registrar	= Ether.getRegistrar(),
	saved		= { },
	overrides	= ['log', 'warn', 'error', 'debug', 'dev'],
	defConfig	=
	{
		format:				"%t.%m:%ttl:%wid:%mn:%sn:%l:%fn(): %msg",
		stackFormat:		"%sn:%l:%fn()",
		maxSize:			500
	},
	stackDepthOverride = 0;

// Uncomment this block for local testing.  Each developer on a team can have
// a separate config file that formats log messages the way they prefer.
/*
req = new XMLHttpRequest();
req.open("GET", 'config.js', false);
req.send();
try
{
	eval("config = " + req.responseText);
}
catch (e)
{
	config = defConfig;
}
*/

config = defConfig;

config.stackDepth = Ether.appMode.stackDepth || config.stackDepth || 1;
	
overrides.forEach(function(what)
	{
		saved[what] = console[what];
		registrar.register(0, restoreConsole, [ what ]);

		console[what] = function() { };
	});

function restoreConsole(what)
{
	console[what] = saved[what];
}

// https://developers.google.com/chrome-developer-tools/docs/console-api#consolelogobject_object
Ether.getConsole = function(module)
{
	var c = Object.create(console);
	
	overrides.forEach(function(what) { c[what] = doMsg.bind(0, what); });

	return c;
	
	function doMsg(what)
	{
		if (Ether.appMode.noLog)
			return;

		try
		{
			var stack,
				oldPrepare = Error.prepareStackTrace;
				
			if (what == 'error')
				stackDepthOverride = 10;

			Error.prepareStackTrace = prepareStackTrace;
				
			stack = (new Error()).stack;

			Error.prepareStackTrace = oldPrepare;

			// This is for the unit tests.  phantomJS doesn't allow
			// Chrome-style stack formatting.
			stack = stack || [ { fileName: '', line: '', fnName: '' } ];

			stack.args = Array.prototype.slice.call(arguments, 1);
			
			stack.moduleName = module;
			stack.at = new Date();
			stack.what = what;
			
			dumpPrevious(stack);
		}
		catch (e)
		{
			saved[what].apply(console, arguments);
			saved[what].call(console, 'Exception in console: %O', e);
		}
		finally
		{
			stackDepthOverride = 0;
		}
	}
};

function dumpPrevious(previous)
{
	var c, args, arg0, line, i,
		module = previous.moduleName,
		filename = previous[0].fileName,
		formatString = '';

	args = previous.args;

	if (fileGroup && (filename != fileGroup))
		console.groupEnd();

	if (moduleGroup && (module != moduleGroup))
		console.groupEnd();

	if (config.groupModules && (module != moduleGroup))
	{
		moduleGroup = module;
		startGroup(moduleGroup);
	}
	
	if (config.groupFiles && (filename != fileGroup))
	{
		fileGroup = filename;
		startGroup(fileGroup);
	}

	arg0 = args[0];

	if (arg0 && (typeof arg0 == 'object'))
	{
		args.unshift(arg0);
		arg0 = '';
		for (i = 1; i < args.length; i++)
		{
			if (typeof args[i] == 'object')
				arg0 += '%O';
			else
				arg0 += '%s'
		}
	}

	c = config.colors && (config.colors[filename] || config.colors[module]);

	line = formatLine(config.format, previous, 0);

	line = line.replace('%msg', arg0);

	if (c)
	{
		args.splice(1, 0, c);
		line = '%c' + line;
	}

	if (previous.length > 1)
	{
		if (args.length == 1)
			line += formatStack(previous);
		else
		{
			line += '%s';
			args.push(formatStack(previous));
		}
	}

	args[0] = line;

	saved[previous.what].apply(console, args);
	
	function startGroup(name)
	{
		var collapsed = config.collapsed,
			expanded  = config.expanded;
			
		if (expanded)
		{
			if (expanded.indexOf(name) < 0)
				console.groupCollapsed(name);
			else
				console.group(name);
		}
		else if (collapsed)
		{
			if (collapsed.indexOf(name) < 0)
				console.group(name);
			else
				console.groupCollapsed(name);
		}
	}
}

function formatLine(format, previous, idx)
{
	format = format.replace('%ttl', document.title);
	format = format.replace('%wid', Ether.IPC.id);
	format = format.replace('%mn', previous.moduleName);
	format = format.replace('%sn', previous[idx].fileName);
	format = format.replace('%ln', previous[idx].fullName);
	format = format.replace('%fn', previous[idx].fnName);
	format = format.replace('%l', previous[idx].line);
	format = format.replace('%c', previous[idx].char);
	format = format.replace('%t', previous.at.toTimeString().substr(0, 8));
	format = format.replace('%m', ('000' + previous.at.getMilliseconds()).substr(-3));
	format = format.replace('%a', previous[idx].formattedArgs || '');

	return format;
}

function formatStack(previous)
{
	var i,
		s = '';
	
	for (i = 1; i < previous.length; i++)
	{
		s += '\n\t';
		s += formatLine(config.stackFormat, previous, i);
	}
	
	return s;
}

var c = Ether.getConsole('<unknown>');
overrides.forEach(function(what) { console[what] = c[what]; });

// http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
function prepareStackTrace(error, frames)
{
	var n, fn, fullName, o, f,
		r = [ ],
		i = 1;

	if (frames)
	{
		while ((i <= (stackDepthOverride || config.stackDepth)) && frames[i])
		{
			f = frames[i++];
			
			fullName = f.getFileName();
			if (fullName)
			{
				n = fullName.split(/\/|\\/);
				n = n.pop();
			}
			else
				n = fullName = 'unknown';
		
			o =
			{
				fileName:	n,
				fullName:	fullName,
				line:		f.getLineNumber(),
				fnName:		f.getFunctionName() || '<anonymous>'
			};
		
			// We can't get the arguments for strict mode code, making this pretty useless for us.
			if (config.verbose || config.tedious)
			{
				fn				= f.getFunction();
				o.formattedArgs	= fn ? formatArgs(fn.arguments) : '(?)';
			}
			
			r.push(o);
		}

		return r;
	}
};

function formatArgs(args)
{
	var arg, objText, value, m, mName, type,
		i = 0,
		argText = [ ];

	while (args && (i < args.length))
	{
		arg = args[i++];
		type = typeof arg;

		switch (type)
		{
			case 'number':
			case 'boolean':
				argText.push(arg);
				break;

			case 'string':
				if (!config.tedious && arg.length > 50)
					arg = arg.substr(0,47) + "...";

				argText.push("'" + arg + "'");
				break;

			case 'function':
				argText.push("function " + arg.name + "()");
				break;

			case 'object':
				try
				{
					if ((config.tedious || config.verbose) && arg)
					{
						objText = [ ];
						value = '';
						for (mName in arg)
						{
							m = arg[mName];
							switch (typeof m)
							{
								case 'number':
								case 'boolean':
									value = m;
									break;

								case 'string':
									if (!config.tedious && m.length > 50)
										m = m.substr(0,47) + "...";
									value = "'" + m + "'";
									break;

								default:
									if (m)
										value = "{" + typeof m + "}";
									else
										value = "" + m;
							}

							objText.push(mName + ":" + value);
						}

						objText = objText.join(", ");
						if (!config.tedious && (objText.length > 50))
							objText = objText.substr(0, 47) + "...";

						argText.push("{" +  objText + "}");
						break;
					}
				}
				catch (e) { }

				arg && argText.push("{" + type + "}");
				arg || argText.push("" + arg);
		}
	}

	return "(" + argText.join(", ") + ")";
}

})();
