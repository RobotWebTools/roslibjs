module.exports = require('object-assign')({
    UrdfBox: require('./UrdfBox'),
    UrdfColor: require('./UrdfColor'),
    UrdfCylinder: require('./UrdfCylinder'),
    UrdfLink: require('./UrdfLink'),
    UrdfMaterial: require('./UrdfMaterial'),
    UrdfMesh: require('./UrdfMesh'),
    UrdfModel: require('./UrdfModel'),
    UrdfSphere: require('./UrdfSphere'),
    UrdfVisual: require('./UrdfVisual')
}, require('./UrdfTypes'));
