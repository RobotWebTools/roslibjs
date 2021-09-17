// Map certain imports to our shim modules. 'base/` is the folder specified by basePath in Karma config.
document.write(/*html*/`
    <script type="importmap">
    {
      "imports": {
        "chai": "/base/test/chai.js",
        "/base/src/RosLibNode.js": "/base/build/roslib.esm.js"
      }
    }
    </script>
`);