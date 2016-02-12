window.require = function require(path) {
	switch (path) {
		case 'eventemitter2': return {EventEmitter2: EventEmitter2};
		case 'xmldom': return {DOMParser: DOMParser}
	}
	var lastIdx = path.lastIndexOf('/'),
		path = lastIdx >= 0 ? path.slice(lastIdx + 1) : path;

	return typeof ROSLIB[path] != 'undefined' ? ROSLIB[path] :
			typeof window[path] != 'undefined' ? window[path] : ROSLIB;
}
