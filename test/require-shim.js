window.require = function require(path) {
	switch (path) {
		case 'eventemitter3': return EventEmitter3;
		case '@xmldom/xmldom': return {DOMParser: DOMParser};
		case 'cbor-js': return CBOR;
		case '../src/util/cborTypedArrayTags.js': return cborTypedArrayTagger;
	}
	var lastIdx = path.lastIndexOf('/'),
		path = lastIdx >= 0 ? path.slice(lastIdx + 1) : path;

	return typeof ROSLIB[path] != 'undefined' ? ROSLIB[path] :
			typeof window[path] != 'undefined' ? window[path] : ROSLIB;
}
