var Graphics = require('./graphics.js')
  , XmlElement = require('./xml-element.js')
  ;

module.exports = (function() {
  'use strict';

  // anchors
  // see jsPlumb anchor model: http://jsplumbtoolkit.com/doc/anchors
  // TODO The documention below is out-of-date. See also pathvisiojs.formatConverter.gpml.point()
  // This model is not fully formed.
  // an anchor is an attachment point at which an edge can originate or terminate.
  // It has the following elements:
  // anchor = {
  //  id: unique value for this anchor
  //  references: reference to the pathway element to which the anchor is bound.
  //  position: percentage of the distance along the specified side of the element or the edge to which the anchor is bound.
  //    For nodes, if the side specified is right or left, the starting point is the topmost point on the side, and
  //    if the side specified is top or bottom, the starting point is the leftmost point on the side (smallest x or y value in SVG coordinate system).
  // }

  var defaults = {
    attributes: {
      Shape: {
        name: 'Shape',
        value: 'None'
      }
    },
    Graphics: {
      attributes: {
        LineThickness: {
          name: 'LineThickness',
          value: 0
        }
      }
    }
  };


  function toPvjson(args, callbackInside) {
    var currentClassLevelPvjsonAndGpmlElements = args.currentClassLevelPvjsonAndGpmlElements
      , currentClassLevelPvjsonElement = currentClassLevelPvjsonAndGpmlElements.pvjsonElement
      , currentClassLevelGpmlElement = currentClassLevelPvjsonAndGpmlElements.gpmlElement
      , anchorElement = args.anchorElement
      , pvjson = args.pvjson
      , points = currentClassLevelPvjsonElement.points
      , pointCount = points.length
      , firstPoint = points[0]
      , lastPoint = points[pointCount - 1]
      , pvjsonAnchor = {}
      ;

    // TODO this might be better as 'gpml:Anchor'
    pvjsonAnchor.gpmlType = 'Anchor';
    pvjsonAnchor.references = currentClassLevelPvjsonElement.id;
    pvjsonAnchor.zIndex = currentClassLevelPvjsonElement.zIndex + 0.1;
    pvjsonAnchor.networkType = 'node';

    var defaultsByShape = {
      Circle: {
        attributes: {
          Height: {
            name: 'Height',
            value: 8
          },
          LineThickness: {
            name: 'LineThickness',
            value: 0
          },
          Shape: {
            name: 'Shape',
            value: 'Circle'
          },
          Width: {
            name: 'Width',
            value: 8
          }
        }
      },
      None: {
        attributes: {
          Height: {
            name: 'Height',
            value: 4
          },
          LineThickness: {
            name: 'LineThickness',
            value: 0
          },
          Shape: {
            name: 'Shape',
            value: 'None'
          },
          Width: {
            name: 'Width',
            value: 4
          }
        }
      }
    };

    var pvjsonAndGpmlElements = {};
    pvjsonAndGpmlElements.pvjsonElement = pvjsonAnchor;
    pvjsonAndGpmlElements.gpmlElement = anchorElement;
    pvjsonAndGpmlElements = XmlElement.toPvjson(pvjsonAndGpmlElements);   
  }



  function toPvjsonOld(pvjs, gpmlSelection, gpmlEdgeSelection, pvjsonEdge, callback) {
    var anchor, anchorSelection, pvjsonAnchor, pvjsonAnchors = [], pvjsonX, pvjsonY, parentElement, pvjsonMarker, attachedPoint, pvjsonAnchorPosition, pvjsonAnchorWidth, pvjsonAnchorHeight;
    var points = pvjsonEdge.points;
    var pointCount = points.length;
    var firstPoint = points[0];
    var lastPoint = points[pointCount - 1];

    gpmlEdgeSelection.find('anchor').each(function() {
      anchor = this;
      anchorSelection = $(this);
      pvjsonAnchor = {};
      pvjsonAnchor.gpmlType = 'Anchor';
      pvjsonAnchor.references = pvjsonEdge.id;
      pvjsonAnchor.zIndex = pvjsonEdge.zIndex + 0.1;
      pvjsonAnchor.networkType = 'node';

      //GpmlElement.toPvjson(pvjs, gpmlSelection, anchorSelection, pvjsonAnchor, function(pvjsonAnchor) {
        Graphics.toPvjson(pvjs, gpmlSelection, anchorSelection, pvjsonAnchor, function(pvjsonAnchor) {
          attachedPoint = gpmlSelection('point[GraphRef=' + pvjsonAnchor.id + ']');
          pvjsonAnchorWidth = pvjsonAnchor.width;
          pvjsonAnchorHeight = pvjsonAnchor.height;
          // TODO handle this after finishing first pass though gpml2jsonpv
          if (attachedPoint.length > 0) {
            pvjsonAnchor.x = parseFloat(attachedPoint.attr('X')) - pvjsonAnchorWidth/2;
            pvjsonAnchor.y = parseFloat(attachedPoint.attr('Y')) - pvjsonAnchorHeight/2;
          }
          else {
            pvjsonAnchorPosition = pvjsonAnchor.position;
            pvjsonAnchor.x = firstPoint.x + pvjsonAnchorPosition * (lastPoint.x - firstPoint.x) - pvjsonAnchorWidth/2;
            pvjsonAnchor.y = firstPoint.y + pvjsonAnchorPosition * (lastPoint.y - firstPoint.y) - pvjsonAnchorHeight/2;
            console.warn('No cached X and Y data available for the Anchor for the edge element below. Assuming LineType of Straight for anchor position calculation.');
            console.log(gpmlEdgeSelection[0][0]);
          }

          pvjsonAnchors.push(pvjsonAnchor);
          });
        //});
    });
    callback(pvjsonAnchors);
  }

  function getAllFromNode(jsonNode, callback) {
    self.jsonNode = jsonNode;
    var jsonAnchors = [];
    var parentId, renderableType, id, position, x, y, sideOffsetX, sideOffsetY, positionOffsetX, positionOffsetY;
    /*
    var elementSides = [
      {'side': 'top', 'initialEdgeDirection': 90},
      {'side': 'right', 'initialEdgeDirection': 0},
      {'side': 'bottom', 'initialEdgeDirection': 270},
      {'side': 'left', 'initialEdgeDirection': 180}
    ];
    //*/
    var elementSides = [
      {'side': 'top', 'dx': 0, 'dy': -1},
      {'side': 'right', 'dx': 1, 'dy': 0},
      {'side': 'bottom', 'dx': 0, 'dy': 1},
      {'side': 'left', 'dx': -1, 'dy': 0}
    ];
    var anchorPositions = [0.25, 0.5, 0.75];

    parentId = jsonNode.id;
    renderableType = 'anchor';

    elementSides.forEach(function(element) {
      sideOffsetX = Math.max(element.dx, 0) * jsonNode.width;
      sideOffsetY = Math.max(element.dy, 0) * jsonNode.height;
      anchorPositions.forEach(function(position) {
        id = String(jsonNode.id) + String(element.side) + String(position);
        positionOffsetX = Math.abs(element.dy) * position * jsonNode.width;
        positionOffsetY = Math.abs(element.dx) * position * jsonNode.height;
        x = jsonNode.x + sideOffsetX + positionOffsetX;
        y = jsonNode.y + sideOffsetY + positionOffsetY;
        jsonAnchors.push({
          'parentId': jsonNode.id,
          'renderableType': 'anchor',
          'side': element.side,
          'dx': element.dx,
          'dy': element.dy,
          'id': id,
          'position': position,
          'x': x,
          'y': y
        });
      });
    });
    //callback(jsonAnchors);
    return jsonAnchors;
  }

  return {
    defaults:defaults,
    toPvjson:toPvjson,
    getAllFromNode:getAllFromNode
  };
}());
