2014-06-11 - **0.8.0**
 * Remove build folder and change examples to use CDN versions of roslib.js [(T045T)](https://github.com/T045T/)
 * Use proper parameters for addTwoInts service [(T045T)](https://github.com/T045T/)
 * Only advertise a topic when it isn't currently being advertised [(T045T)](https://github.com/T045T/)
 * Use the same ID to unadvertise a topic as was used to advertise it [(T045T)](https://github.com/T045T/)
 * Remove, rather than add, leading slash from tf frame name [(T045T)](https://github.com/T045T/)

2014-05-13 - **r7**
 * Removed sending value as a message field in GetParam service call [(mitchellwills)](https://github.com/mitchellwills/)
 * Update UrdfBox.js [(Vegekou)](https://github.com/Vegekou/)
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
