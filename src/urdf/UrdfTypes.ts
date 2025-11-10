import type { Element } from "@xmldom/xmldom";

export enum UrdfType {
  SPHERE = 0,
  BOX = 1,
  CYLINDER = 2,
  MESH = 3,
}

export enum UrdfAttrs {
  Name = "name",
  Type = "type",
  Parent = "parent",
  Link = "link",
  Child = "child",
  Limit = "limit",
  Upper = "upper",
  Lower = "lower",
  Origin = "origin",
  Xyz = "xyz",
  Rpy = "rpy",
  Size = "size",
  Rgba = "rgba",
  Length = "length",
  Radius = "radius",
  Visuals = "visual",
  Texture = "texture",
  Filename = "filename",
  Color = "color",
  Geometry = "geometry",
  Material = "material",
  Scale = "scale",
  Axis = "axis",
}

export interface UrdfDefaultOptions {
  /**
   * The XML element to parse.
   */
  xml: Element;
}
