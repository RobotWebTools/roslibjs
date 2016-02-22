2016-02-17 - **0.18.0**
 * Update roslibjs to advertise Services [(chris-smith)](https://github.com/chris-smith/)
 * Added repubServiceName parameter to TFClient. [(BennyRe)](https://github.com/BennyRe/)

2015-09-01 - **0.17.0**
 * Canvas version bump to use for both node version 0.10.34 and 0.12.7 [(jihoonl)](https://github.com/jihoonl/)
 * Replace xmlshim with xmldom [(Rayman)](https://github.com/Rayman/)

2015-08-14 - **0.16.0**
 * Adds BSON support [(DLu)](https://github.com/DLu/)
 * Update failed callback when rosservice is called [(dwlee)](https://github.com/dwlee/)

2015-04-10 - **0.15.0**
 * Remove the (unused) DOMParser shim [(Rayman)](https://github.com/Rayman/)
 * Check for install of cairo (removes sudo from npm install) [(rctoris)](https://github.com/rctoris/)

2015-03-09 - **0.13.0**
 * URDF joint added [(DLu)](https://github.com/DLu/)
 * Index components of roslib [(megawac)](https://github.com/megawac/)
 * Add function that find service and topic as specific type [(dwlee)](https://github.com/dwlee/)
 * Allow UrdfLink to have multiple visual elements [(jakobs)](https://github.com/jakobs/)
 * Support queue_length for subscribing [(psoetens)](https://github.com/psoetens/)
 * Quaternion.js has now a norm() function [(b1willaert)](https://github.com/b1willaert/)

2015-02-04 - **0.12.0**
 * Reverted to old TF client [(rctoris)](https://github.com/rctoris/)

2015-02-04 - **0.11.0**
 * Change TFClient to use the service interface rather than the action one [(T045T)](https://github.com/T045T/)
 * Simplify TFClient and allow unsubscribe by key [(megawac)](https://github.com/megawac/)
 * Add groovyCompatibility option to Ros [(T045T)](https://github.com/T045T/)
 * Fix the param tests [(megawac)](https://github.com/megawac/)
 * Allow unsubbing a particular listner without affecting others [(megawac)](https://github.com/megawac/)
 * Add tests for set sans callback [(megawac)](https://github.com/megawac/)
 * Make registering as a subscriber or publisher an option for the streaming API [(megawac)](https://github.com/megawac/)

2014-12-08 - **0.10.0**
 * Refactor Karma testing and build configuration [(megawac)](https://github.com/megawac/)
 * Remove testing invalid XML [(megawac)](https://github.com/megawac/)
 * Use the correct id when unsubbing a Topic [(megawac)](https://github.com/megawac/)
 * Simplify core/Topic [(megawac)](https://github.com/megawac/)
 * Make source files UMD compliant [(megawac)](https://github.com/megawac/)
 * Refactor tests to support node [(megawac)](https://github.com/megawac/)
 * Allow multiple subscriptions to a topic [(megawac)](https://github.com/megawac/)
 * Unsubscribe should not remove other topic's listeners [(megawac)](https://github.com/megawac/)
 * Alternative syntax for create Topics, Services, Params, etc [(megawac)](https://github.com/megawac/)
 * Fixed quaternion default value issue [Akin Sisbot]
 * TCP connections to ROS bridge for node [(megawac)](https://github.com/megawac/)

2014-09-09 - **0.9.0**
 * Add connection status indicator to roslibjs examples [(T045T)](https://github.com/T045T/)
 * Add a bower.json to publish this as a Bower packagee [(Rayman)](https://github.com/Rayman/)
 * Add a basic urdf test [(syrnick)](https://github.com/syrnick/)
 * Add troubleshooting section [(syrnick)](https://github.com/syrnick/)
 * Add queue_size to topic publisher [(syrnick)](https://github.com/syrnick/)
 * TFClient.unsubscribe(): remove leading slash from frame ID [(T045T)](https://github.com/T045T/)
 * Update EventEmitter2 to 0.4.14 [(T045T)](https://github.com/T045T/)
 * SimpleActionServer functionality [(oss1pal)](https://github.com/oss1pal/)

2014-06-11 - **0.8.0**
 * Remove build folder and change examples to use CDN versions of roslib.js [(T045T)](https://github.com/T045T/)
 * Use proper parameters for addTwoInts service [(T045T)](https://github.com/T045T/)
 * Only advertise a topic when it isn't currently being advertised [(T045T)](https://github.com/T045T/)
 * Use the same ID to unadvertise a topic as was used to advertise it [(T045T)](https://github.com/T045T/)
 * Remove, rather than add, leading slash from tf frame name [(T045T)](https://github.com/T045T/)

2014-05-13 - **r7**
 * Removed sending value as a message field in GetParam service call [(mitchellwills)](https://github.com/mitchellwills/)
 * Update UrdfBox.js [(rbonghi)](https://github.com/rbonghi/)
 * Send 'latch' parameter to publish and advertise commands [(adamantivm)](https://github.com/adamantivm/)
 * Fixed ros service call parameter order [(Pro)](https://github.com/Pro/)
 * Added error message from rosbridge to failedCallback [(Pro)](https://github.com/Pro/)
 * Adding some functions to resolve ros message type [(garaemon)](https://github.com/garaemon/)
 * Adding functions to Ros: decodeTypeDefs, getMessageDetails, getTopicType [(garaemon)](https://github.com/garaemon/)
 * Handle service call failure using new rosbridge protocol [(OTL)](https://github.com/OTL/)
 * Adding prototype getNodes to ROSLIB.Ros allowing to get list of available nodes [(barraq)](https://github.com/barraq/)

2013-05-07 - **r6**
 * Fixes missing ID counter in ROS so multiple service calls can be made [(rctoris)](https://github.com/rctoris/)
 * Unlimited number of event listeners added [(baalexander)](https://github.com/baalexander/)

2013-04-09 - **r5**
 * Replaces build system with Grunt [(baalexander)](https://github.com/baalexander/)
 * Code cleanup for linter [(baalexander)](https://github.com/baalexander/)

2013-04-02 - **r4**
 * Bug in UrdfVisual origin to Pose conversion fixed [(rctoris)](https://github.com/rctoris/)
 * Unit test infrastructure started [(baalexander)](https://github.com/baalexander/)

2013-03-28 - **r3**
 * URDF XML parser added [(rctoris)](https://github.com/rctoris/)

2013-03-14 - **r2**
 * First stable release [(rctoris)](https://github.com/rctoris/), [(baalexander)](https://github.com/baalexander/)

2013-03-14 - **r1**
 * Initial development of ROSLIB [(rctoris)](https://github.com/rctoris/)
