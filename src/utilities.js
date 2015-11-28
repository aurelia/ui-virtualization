export function calcOuterHeight(element){
  var height;
  height = element.getBoundingClientRect().height;
  height += getStyleValue(element, 'marginTop');
  height += getStyleValue(element, 'marginBottom');
  return height;
}

export function calcScrollHeight(element){
  var height;
  height = element.getBoundingClientRect().height;
  height -= getStyleValue(element, 'borderTopWidth');
  height -= getStyleValue(element, 'borderBottomWidth');
  return height;
}

export function getNthNode(nodes, n, nodeType, fromBottom) {
  var foundCount = 0, i = 0, found, node, lastIndex;

  lastIndex = nodes.length - 1;

  if(fromBottom){ i = lastIndex; }

  do{
    node = nodes[i];
    if(node.nodeType === nodeType){
      ++foundCount;
      if(foundCount === n){
        found = true;
      }
    }
    if(fromBottom){ --i; } else { ++i; }
  } while(!found || i === lastIndex || i === 0);

  return node;
}

function getStyleValue(element, style){
  var currentStyle, styleValue;
  currentStyle = element.currentStyle || window.getComputedStyle(element);
  styleValue = parseInt(currentStyle[style]);
  return Number.isNaN(styleValue) ? 0 : styleValue;
}
