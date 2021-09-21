
document.write(/*html*/`
  <script type="importmap">
    {
      "imports": {
        "chai": "/base/test/util/shim/chai.js",
        "stream": "/base/test/util/shim/stream.js",
        "xmldom": "/base/src/util/shim/xmldom.js",
        "cbor-js": "/base/src/util/shim/cbor.js",
        "/base/src/RosLibNode.js": "/base/build/roslib.esm.js"
      }
    }
  </script>
`);