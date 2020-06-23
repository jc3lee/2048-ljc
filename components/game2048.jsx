import { useState, useEffect, useRef } from "react"
import { animated, useSpring, useSprings, config } from "react-spring"
import { useGesture } from "react-use-gesture"

const TILE_SIDE = 75

const nbArrDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

let totalScore = 0

let toggleHelp = false

let reached2048 = false
let continueGame = false

let prevTotalScoreArr = []

let gameOver = false

let prevItemsArr = []

let didUndo = false

const twitterText = "Hello%20world%2C%20I%20had%20the%20bad%20luck%20of%20clicking%20that%20follow%20button%20on%20that%20dude%27s%20account%20and%20now%20I%27m%20playing%20a%20crappy%20game%20to%20not%20hurt%20his%20feelings."

const backArr = [
  "#ffffff",
  "#eee4db",
  "#eedfc8",
  "#f2b179",
  "#ec8d55",
  "#f57c5f",
  "#ea5a38",
  "#edce73",
  "#f2d04b",
  "#efc654",
  "#e3ba14",
  "#efc233",
  "#ed666b",
  "#000000",
]

const getBack = value => {
  switch (value) {
    case 0:
      return backArr[0]
    case 2:
      return backArr[1]
    case 4:
      return backArr[2]
    case 8:
      return backArr[3]
    case 16:
      return backArr[4]
    case 32:
      return backArr[5]
    case 64:
      return backArr[6]
    case 128:
      return backArr[7]
    case 256:
      return backArr[8]
    case 512:
      return backArr[9]
    case 1024:
      return backArr[10]
    case 2048:
      return backArr[11]
    case 4096:
      return backArr[12]
    default:
      return backArr[13]
  }
}

const nbArrayXY = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
]

let items = []

const initItems = () => {
  //adding 17 items not 16 bc recycle doesn't act after moving so need one extra tile
  for (let i = 0; i < 17; i++) {
    items[i] = { value: 0, x: 0, y: 0, back: backArr[0], nbInArr: -1, zIndex: 1001, appeared: false, bounce: false, }
  }
}

initItems()

const getRandNb = max => Math.floor(Math.random() * max)
//probability of getting a 2 = 90%, and a 4 = 10%
const getNewNb = () => Math.random() < 0.9 ? 2 : 4

const findZeroValueIndex = () => items.findIndex(i => i.value === 0)

const updateItem = (itemIndex, value, back, nbInArr, zIndex, keepXY = false) => {
  items[itemIndex].value = value
  if (!keepXY) {
    if (nbInArr < 0) {
      items[itemIndex].x = 0
      items[itemIndex].y = 0
    } else {
      items[itemIndex].x = nbArrayXY[nbInArr].x * TILE_SIDE
      items[itemIndex].y = nbArrayXY[nbInArr].y * TILE_SIDE
    }
  }
  items[itemIndex].back = back
  items[itemIndex].nbInArr = nbInArr
  items[itemIndex].zIndex = zIndex
  items[itemIndex].appeared = false
  items[itemIndex].bounce = false
}

const recycleItems = () => {
  while (true) {
    const itemIndex = items.findIndex(i => i.zIndex !== 1001)
    if (itemIndex === -1) break
    updateItem(itemIndex, 0, backArr[0], -1, 1001, true)
  }
}

const updateItemAnimationState = () => {
  for (let item of items) {
    //update item appeared
    item.appeared = item.nbInArr !== -1 || item.zIndex !== 1001
    item.bounce = false
  }
}

const moveLeft = () => {
  let canMove = false
  //loop through 
  for (let colNb = 0; colNb < 16; colNb += 4) {
    //add an alreadyAdded boolean
    let leftItem, alreadyAdded = false
    for (let nbInArr = colNb; nbInArr < 4 + colNb; nbInArr++) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!leftItem) {
        //nothing to compare against => move it to the utmost left 
        if (item.x !== 0) {
          //update canMove to true
          canMove = true
          item.x = 0
        } else {
          //can't move
        }
        //also update nbInArr to the utmost left
        item.nbInArr = colNb
        //and set it as leftItem
        leftItem = item
      } else {
        if (alreadyAdded) {
          //move item next to leftItem
          if (item.x !== leftItem.x + TILE_SIDE) {
            //update canMove to true
            canMove = true
            item.x = leftItem.x + TILE_SIDE
          } else {
            //can't move
          }
          //also update nbInArr
          item.nbInArr = leftItem.nbInArr + 1
          //reset alreadyAdded to false
          alreadyAdded = false
          //switch leftItem to current item
          leftItem = item
        } else {
          //compare leftItem with item
          if (leftItem.value === item.value) {
            //same value
            //move item to leftItem
            //update canMove to true bc if same value obviously can move
            canMove = true
            item.x = leftItem.x
            //also update nbInArr to -1 to get it out of the array
            item.nbInArr = -1
            //decrease item zIndex so that item slides below leftItem also to prepare it to recycle
            item.zIndex--
            //updating the leftItem won't be reflected in items => find item in items to update
            const itemToUpdate = items.find(i => i.nbInArr === leftItem.nbInArr)
            //update value
            itemToUpdate.value *= 2
            //update back too
            itemToUpdate.back = getBack(itemToUpdate.value)
            //update bounce too
            itemToUpdate.bounce = true
            //update score too
            totalScore += itemToUpdate.value
            //check if has reached 2048
            if (itemToUpdate.value === 2048) reached2048 = true
            else reached2048 = false
            // console.log("updated bounce", itemToUpdate)
            //change alreadyAdded to true to prevent adding to it
            alreadyAdded = true
            //don't switch leftItem to current item!!!
          } else {
            //different value
            //move item next to leftItem
            if (item.x !== leftItem.x + TILE_SIDE) {
              //update canMove to true only if item not sticking to leftItem
              canMove = true
              item.x = leftItem.x + TILE_SIDE
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = leftItem.nbInArr + 1
            //change alreadyAdded to false to allow adding to it
            alreadyAdded = false
            //switch leftItem to current item
            leftItem = item
          }
        }
        continue
      }
    }
  }
  // console.log("items af", items)
  return canMove
}

const moveRight = () => {
  let canMove = false
  //loop through 
  for (let colNb = 3; colNb < 16; colNb += 4) {
    //add an alreadyAdded boolean
    let rightItem, alreadyAdded = false
    for (let nbInArr = colNb; nbInArr > - 4 + colNb; nbInArr--) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!rightItem) {
        //nothing to compare against => move it to the utmost right 
        if (item.x !== 3 * TILE_SIDE) {
          //update canMove to true
          canMove = true
          item.x = 3 * TILE_SIDE
        } else {
          //can't move
        }
        //also update nbInArr to the utmost right
        item.nbInArr = colNb
        //and set it as rightItem
        rightItem = item
      } else {
        if (alreadyAdded) {
          //move item next to rightItem
          if (item.x !== rightItem.x - TILE_SIDE) {
            //update canMove to true
            canMove = true
            item.x = rightItem.x - TILE_SIDE
          } else {
            //can't move
          }
          //also update nbInArr
          item.nbInArr = rightItem.nbInArr - 1
          //reset alreadyAdded to false
          alreadyAdded = false
          //switch rightItem to current item
          rightItem = item
        } else {
          //compare rightItem with item
          if (rightItem.value === item.value) {
            //same value
            //move item to rightItem
            //update canMove to true bc if same value obviously can move
            canMove = true
            item.x = rightItem.x
            //also update nbInArr to -1 to get it out of the array
            item.nbInArr = -1
            //decrease item zIndex so that item slides below rightItem also to prepare it to recycle
            item.zIndex--
            //updating the rightItem won't be reflected in items => find item in items to update
            const itemToUpdate = items.find(i => i.nbInArr === rightItem.nbInArr)
            //update value
            itemToUpdate.value *= 2
            //update back too
            itemToUpdate.back = getBack(itemToUpdate.value)
            //update bounce too
            itemToUpdate.bounce = true
            //update score too
            totalScore += itemToUpdate.value
            //check if has reached 2048
            if (itemToUpdate.value === 2048) reached2048 = true
            else reached2048 = false
            // console.log("updated bounce", itemToUpdate)
            //change alreadyAdded to true to prevent adding to it
            alreadyAdded = true
            //don't switch rightItem to current item!!!
          } else {
            //different value
            //move item next to rightItem
            if (item.x !== rightItem.x - TILE_SIDE) {
              //update canMove to true only if item not sticking to rightItem
              canMove = true
              item.x = rightItem.x - TILE_SIDE
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = rightItem.nbInArr - 1
            //change alreadyAdded to false to allow adding to it
            alreadyAdded = false
            //switch rightItem to current item
            rightItem = item
          }
        }
        continue
      }
    }
  }
  // console.log("items af", items)
  return canMove
}

const moveTop = () => {
  let canMove = false
  //loop through
  for (let rowNb = 0; rowNb < 4; rowNb++) {
    //add an alreadyAdded boolean
    let topItem, alreadyAdded = false
    for (let nbInArr = rowNb; nbInArr < 16; nbInArr += 4) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!topItem) {
        //nothing to compare against => move it to the utmost top 
        if (item.y !== 0) {
          //update canMove to true
          canMove = true
          item.y = 0
        } else {
          //can't move
        }
        //also update nbInArr to the utmost top
        item.nbInArr = rowNb
        //and set it as topItem
        topItem = item
      } else {
        if (alreadyAdded) {
          //move item next to topItem
          if (item.y !== topItem.y + TILE_SIDE) {
            //update canMove to true
            canMove = true
            item.y = topItem.y + TILE_SIDE
          } else {
            //can't move
          }
          //also update nbInArr
          item.nbInArr = topItem.nbInArr + 4
          //reset alreadyAdded to false
          alreadyAdded = false
          //switch topItem to current item
          topItem = item
        } else {
          //compare topItem with item
          if (topItem.value === item.value) {
            //same value
            //move item to topItem
            //update canMove to true bc if same value obviously can move
            canMove = true
            item.y = topItem.y
            //also update nbInArr to -1 to get it out of the array
            item.nbInArr = -1
            //decrease item zIndex so that item slides below topItem also to prepare it to recycle
            item.zIndex--
            //updating the topItem won't be reflected in items => find item in items to update
            const itemToUpdate = items.find(i => i.nbInArr === topItem.nbInArr)
            //update value
            itemToUpdate.value *= 2
            //update back too
            itemToUpdate.back = getBack(itemToUpdate.value)
            //update bounce too
            itemToUpdate.bounce = true
            //update score too
            totalScore += itemToUpdate.value
            //check if has reached 2048
            if (itemToUpdate.value === 2048) reached2048 = true
            else reached2048 = false
            // console.log("updated bounce", itemToUpdate)
            //change alreadyAdded to true to prevent adding to it
            alreadyAdded = true
            //don't switch topItem to current item!!!
          } else {
            //different value
            //move item next to topItem
            if (item.y !== topItem.y + TILE_SIDE) {
              //update canMove to true only if item not sticking to topItem
              canMove = true
              item.y = topItem.y + TILE_SIDE
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = topItem.nbInArr + 4
            //change alreadyAdded to false to allow adding to it
            alreadyAdded = false
            //switch topItem to current item
            topItem = item
          }
        }
        continue
      }
    }
  }
  // console.log("items af", items)
  return canMove
}

const moveBtm = () => {
  let canMove = false
  //loop through
  for (let rowNb = 12; rowNb < 16; rowNb++) {
    //add an alreadyAdded boolean
    let btmItem, alreadyAdded = false
    for (let nbInArr = rowNb; nbInArr > -1; nbInArr -= 4) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!btmItem) {
        //nothing to compare against => move it to the utmost btm
        if (item.y !== 3 * TILE_SIDE) {
          //update canMove to true
          canMove = true
          item.y = 3 * TILE_SIDE
        } else {
          //can't move
        }
        //also update nbInArr to the utmost btm
        item.nbInArr = rowNb
        //and set it as btmItem
        btmItem = item
      } else {
        if (alreadyAdded) {
          //move item next to btmItem
          if (item.y !== btmItem.y - TILE_SIDE) {
            //update canMove to true
            canMove = true
            item.y = btmItem.y - TILE_SIDE
          } else {
            //can't move
          }
          //also update nbInArr
          item.nbInArr = btmItem.nbInArr - 4
          //reset alreadyAdded to false
          alreadyAdded = false
          //switch btmItem to current item
          btmItem = item
        } else {
          //compare btmItem with item
          if (btmItem.value === item.value) {
            //same value
            //move item to btmItem
            //update canMove to true bc if same value obviously can move
            canMove = true
            item.y = btmItem.y
            //also update nbInArr to -1 to get it out of the array
            item.nbInArr = -1
            //decrease item zIndex so that item slides below btmItem also to prepare it to recycle
            item.zIndex--
            //updating the btmItem won't be reflected in items => find item in items to update
            const itemToUpdate = items.find(i => i.nbInArr === btmItem.nbInArr)
            //update value
            itemToUpdate.value *= 2
            //update back too
            itemToUpdate.back = getBack(itemToUpdate.value)
            //update bounce too
            itemToUpdate.bounce = true
            //update score too
            totalScore += itemToUpdate.value
            //check if has reached 2048
            if (itemToUpdate.value === 2048) reached2048 = true
            else reached2048 = false
            // console.log("updated bounce", itemToUpdate)
            //change alreadyAdded to true to prevent adding to it
            alreadyAdded = true
            //don't switch btmItem to current item!!!
          } else {
            //different value
            //move item next to btmItem
            if (item.y !== btmItem.y - TILE_SIDE) {
              //update canMove to true only if item not sticking to btmItem
              canMove = true
              item.y = btmItem.y - TILE_SIDE
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = btmItem.nbInArr - 4
            //change alreadyAdded to false to allow adding to it
            alreadyAdded = false
            //switch topItem to current item
            btmItem = item
          }
        }
        continue
      }
    }
  }
  // console.log("items af", items)
  return canMove
}

const addItem = () => {
  //check empty spots
  //get all the filled spots in an Arr
  const filledSpotsArr = []
  for (let item of items) {
    const { nbInArr } = item
    if (nbInArr !== -1) filledSpotsArr[filledSpotsArr.length] = nbInArr
  }
  const remainingSpots = nbArrDefault.filter(nb => !filledSpotsArr.includes(nb))
  // console.log("remaining spots", remainingSpots)
  const randNb = getRandNb(remainingSpots.length)
  // console.log("randNb", randNb, "spot", remainingSpots[randNb])
  let i1 = findZeroValueIndex()
  let randValue = getNewNb()
  updateItem(i1, randValue, getBack(randValue), remainingSpots[randNb], 1001)
}

const checkForGameOver = () => {
  if (checkLeft() || checkBtm() || checkRight() || checkTop()) {
    return false
  } else {
    return true
  }
}

const checkLeft = () => {
  let canMove = false
  //loop through 
  for (let colNb = 0; colNb < 16; colNb += 4) {
    //add an alreadyAdded boolean
    let leftItem
    for (let nbInArr = colNb; nbInArr < 4 + colNb; nbInArr++) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!leftItem) {
        //nothing to compare against => move it to the utmost left 
        if (item.x !== 0) {
          //update canMove to true
          canMove = true
          return canMove
        } else {
          //can't move
        }
        leftItem = item
      } else {
        //compare leftItem with item
        if (leftItem.value === item.value) {
          //same value
          //move item to leftItem
          //update canMove to true bc if same value obviously can move
          canMove = true
          return canMove
        } else {
          //different value
          //move item next to leftItem
          if (item.x !== leftItem.x + TILE_SIDE) {
            //update canMove to true only if item not sticking to leftItem
            canMove = true
            return canMove
          } else {
            //can't move
          }
          //switch leftItem to current item
          leftItem = item
        }
      }
    }
  }
  // console.log("items af", items)
  return canMove
}

const checkRight = () => {
  let canMove = false
  //loop through 
  for (let colNb = 3; colNb < 16; colNb += 4) {
    //add an alreadyAdded boolean
    let rightItem
    for (let nbInArr = colNb; nbInArr > - 4 + colNb; nbInArr--) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!rightItem) {
        //nothing to compare against => move it to the utmost right 
        if (item.x !== 3 * TILE_SIDE) {
          //update canMove to true
          canMove = true
          return canMove
        } else {
          //can't move
        }
        rightItem = item
      } else {
        //compare rightItem with item
        if (rightItem.value === item.value) {
          //same value
          //move item to rightItem
          //update canMove to true bc if same value obviously can move
          canMove = true
          return canMove
        } else {
          //different value
          //move item next to rightItem
          if (item.x !== rightItem.x - TILE_SIDE) {
            //update canMove to true only if item not sticking to rightItem
            canMove = true
            return canMove
          } else {
            //can't move
          }
          rightItem = item
        }
      }
      continue
    }
  }
  // console.log("items af", items)
  return canMove
}

const checkTop = () => {
  let canMove = false
  //loop through
  for (let rowNb = 0; rowNb < 4; rowNb++) {
    //add an alreadyAdded boolean
    let topItem
    for (let nbInArr = rowNb; nbInArr < 16; nbInArr += 4) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!topItem) {
        //nothing to compare against => move it to the utmost top 
        if (item.y !== 0) {
          //update canMove to true
          canMove = true
          return canMove
        } else {
          //can't move
        }
        //and set it as topItem
        topItem = item
      } else {
        //compare topItem with item
        if (topItem.value === item.value) {
          //same value
          //move item to topItem
          //update canMove to true bc if same value obviously can move
          canMove = true
          return canMove
        } else {
          //different value
          //move item next to topItem
          if (item.y !== topItem.y + TILE_SIDE) {
            //update canMove to true only if item not sticking to topItem
            canMove = true
            return canMove
          } else {
            //can't move
          }
          topItem = item
        }
      }
      continue
    }
  }
  // console.log("items af", items)
  return canMove
}

const checkBtm = () => {
  let canMove = false
  //loop through
  for (let rowNb = 12; rowNb < 16; rowNb++) {
    //add an alreadyAdded boolean
    let btmItem
    for (let nbInArr = rowNb; nbInArr > -1; nbInArr -= 4) {
      const item = items.find(i => i.nbInArr === nbInArr)
      if (!item) continue
      if (!btmItem) {
        //nothing to compare against => move it to the utmost btm
        if (item.y !== 3 * TILE_SIDE) {
          //update canMove to true
          canMove = true
          return canMove
        } else {
          //can't move
        }
        btmItem = item
      } else {
        //compare btmItem with item
        if (btmItem.value === item.value) {
          //same value
          //move item to btmItem
          //update canMove to true bc if same value obviously can move
          canMove = true
          return canMove
        } else {
          //different value
          //move item next to btmItem
          if (item.y !== btmItem.y - TILE_SIDE) {
            //update canMove to true only if item not sticking to btmItem
            canMove = true
            return canMove
          } else {
            //can't move
          }
          //switch topItem to current item
          btmItem = item
        }
      }
      continue
    }
  }
  // console.log("items af", items)
  return canMove
}

const Game2048 = () => {

  const helpRef = useRef(null)
  const winRef = useRef(null)
  const gameOverRef = useRef(null)
  const scoreRef = useRef(null)
  const highscoreRef = useRef(null)

  const bind = useGesture({
    onDrag: ({ movement: [x, y], tap, cancel, down }) => {
      //do nothing when tapping, only detect drag
      if (tap) return
      cancel()
    },
    onDragEnd: ({ movement: [x, y] }) => {
      // console.log(x, y)
      //detect whether mouse dragging left, right, top, btm
      if (Math.abs(x) > Math.abs(y)) {
        //left or right
        if (x > 0) {
          //right
          handleMove(2)
        } else {
          //left
          handleMove(0)
        }
      } else {
        //top or btm
        if (y > 0) {
          //btm
          handleMove(3)
        } else {
          //top
          handleMove(1)
        }
      }

    }
  },
    {
      drag: { filterTaps: true, threshold: 50 }
    }
  )

  const updateScore = () => {
    scoreRef.current.innerText = totalScore
    if (window.localStorage.getItem("highscore") < totalScore) {
      window.localStorage.setItem("highscore", totalScore)
      highscoreRef.current.innerText = totalScore
    }
  }

  const [resetCounter, incrResetCounter] = useState(0)

  const [itemsProps, setItems] = useSprings(items.length, index => ({
    opacity: items[index].value ? 1 : 0,
    x: items[index].x,
    y: items[index].y,
    background: items[index].back,
    scale: items[index].value ? 1 : 0,
    value: items[index].value,
    zIndex: items[index].zIndex,
    color: items[index].value > 4 ? "white" : "black",
  }))

  useEffect(() => {
    initHighScore()
    initGame()
    //add keypress
    window.addEventListener("keydown", handleKeyPress)
    //add share script
    const script = document.createElement("script")
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      // console.log("cleaned")
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [resetCounter])

  const handleKeyPress = e => {
    switch (e.keyCode) {
      case 37:
        handleMove(0)
        break
      case 38:
        handleMove(1)
        break
      case 39:
        handleMove(2)
        break
      case 40:
        handleMove(3)
        break
      default:
      // console.log("key error")
    }
  }

  const initGame = () => {
    let rd1 = 0, rd2 = 0
    do {
      rd1 = getRandNb(16)
      rd2 = getRandNb(16)
    } while (rd1 === rd2)
    let i1 = findZeroValueIndex()
    let randValue1 = getNewNb()
    updateItem(i1, randValue1, getBack(randValue1), rd1, 1001)
    let i2 = findZeroValueIndex()
    let randValue2 = getNewNb()
    updateItem(i2, randValue2, getBack(randValue2), rd2, 1001)
    setItems(index => ({
      to: async (next) => {
        await next({
          opacity: items[index].value ? 1 : 0,
          x: items[index].x,
          y: items[index].y,
          background: items[index].back,
          zIndex: items[index].zIndex,
          value: items[index].value,
          color: items[index].value > 4 ? "white" : "black",
          immediate: true
        })
        await next({
          scale: items[index].value ? 1 : 0,
        })
      }
    }))
    updateItemAnimationState()
    //keep this version in the prevItemsArr
    prevItemsArr.push(items.map(i => Object.assign({}, i)))
    prevTotalScoreArr.push(totalScore)
  }

  const initHighScore = () => {
    highscoreRef.current.innerText =
      window.localStorage.getItem("highscore") || 0
  }

  const resetGame = () => {
    hideWin()
    hideHelp()
    toggleHelp = false
    hideGameOver()

    setItems(index => ({
      to: async (next) => {
        await next({
          opacity: items[index].value ? 1 : 0,
          x: items[index].x,
          y: items[index].y,
          background: items[index].back,
          zIndex: items[index].zIndex,
          value: items[index].value,
          scale: 0,
          color: items[index].value > 4 ? "white" : "black",
          immediate: true,
        })
      }
    }))
    initItems()

    incrResetCounter(resetCounter + 1)
    //only for debug resetting high score
    // window.localStorage.setItem("highscore", 0)
    totalScore = 0
    prevTotalScoreArr = []
    prevItemsArr = []
    updateScore()
    gameOver = false
    didUndo = false
    reached2048 = false
    continueGame = false
  }

  const handleUndo = () => {
    hideWin()
    hideHelp()
    hideGameOver()

    toggleHelp = false
    if (prevItemsArr.length < 2) return
    if (didUndo) return
    didUndo = true
    items = prevItemsArr[prevItemsArr.length - 2]
    prevItemsArr.push(items.map(i => Object.assign({}, i)))
    //reset score
    totalScore = prevTotalScoreArr[prevTotalScoreArr.length - 2]
    prevTotalScoreArr.push(totalScore)
    updateScore()
    setItems(index => ({
      to: async (next) => {
        if (items[index].zIndex === 1000) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            zIndex: items[index].zIndex,
            value: items[index].value,
            color: items[index].value > 4 ? "white" : "black",

            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
          })
          await next({
            opacity: 0,
            scale: 0,
            immediate: true,
          })
        }
        else if (items[index].appeared && items[index].bounce) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
            scale: 1.1,
            config: { duration: 250 }
          })
          await next({
            scale: 1,
            config: { duration: 200 }
          })
        }
        else if (items[index].appeared) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 250 }
          })
        } else {
          await next({
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            x: items[index].x,
            y: items[index].y,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          })
          await next({
            opacity: items[index].value ? 1 : 0,
            config: { duration: 250 }
          })
        }
      }
    }))
    if (gameOver) {
      gameOver = false
    }
  }

  const handleMove = (direction) => {
    if (toggleHelp) return
    if (gameOver) return
    let canMove
    switch (direction) {
      case 0:
        canMove = moveLeft()
        break
      case 1:
        canMove = moveTop()
        break
      case 2:
        canMove = moveRight()
        break
      case 3:
        canMove = moveBtm()
        break
      default:
        // console.log("canMove error")
        canMove = false
    }
    // console.log("canMove", canMove)
    if (!canMove) return
    didUndo = false
    addItem()
    setItems(index => ({
      to: async (next) => {
        if (items[index].zIndex === 1000) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            zIndex: items[index].zIndex,
            value: items[index].value,
            color: items[index].value > 4 ? "white" : "black",

            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 200 }
          })
          await next({
            opacity: 0,
            scale: 0,
            immediate: true,
          })
        }
        else if (items[index].appeared && items[index].bounce) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
            scale: 1.1,
            config: { duration: 200 }
          })
          await next({
            scale: 1,
            config: { duration: 100 }
          })
        }
        else if (items[index].appeared) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          })
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 200 }
          })
        } else {
          await next({
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            x: items[index].x,
            y: items[index].y,
            immediate: true,
          })
          await next({
            opacity: items[index].value ? 1 : 0,
            scale: items[index].value ? 1 : 0,
            config: { duration: 200 }
          })
        }
      }
    }))
    //updateScore
    updateScore()
    //recycle items that need reset, basically items with nbInArr = -1
    //recycling create animation bug need to recycle value but not x and y
    //update added keepXY
    updateItemAnimationState()
    recycleItems()
    gameOver = checkForGameOver()
    // // DEBUG
    // gameOver = true
    if (gameOver) {
      //show gameOver
      showGameOver()
    }

    // reached2048 = true
    //check if won the game
    if (reached2048 && !continueGame) {
      gameOver = true
      showWin()
    }
    //keep this version in the prevItemsArr
    prevItemsArr.push(items.map(i => Object.assign({}, i)))
    prevTotalScoreArr.push(totalScore)
  }

  const handleContinue = () => {
    continueGame = true
    gameOver = false
    hideWin()
  }

  const handleHelp = () => {
    toggleHelp = !toggleHelp
    if (toggleHelp) {
      showHelp()
    } else {
      hideHelp()
    }
  }

  const showHelp = () => {
    helpRef.current.classList.add("showHelp")
  }

  const hideHelp = () => {
    if (helpRef.current.classList.contains("showHelp"))
      helpRef.current.classList.remove("showHelp")
  }

  const showWin = () => {
    winRef.current.classList.add("showWin")
  }

  const hideWin = () => {
    if (winRef.current.classList.contains("showWin"))
      winRef.current.classList.remove("showWin")
  }

  const showGameOver = () => {
    gameOverRef.current.classList.add("showGameOver")
  }

  const hideGameOver = () => {
    if (gameOverRef.current.classList.contains("showGameOver"))
      gameOverRef.current.classList.remove("showGameOver")
  }

  return (
    <main>
      <div className="topContainer">
        <div className="topContainerTop">
          <h3 className="title">2048</h3>
          <div className="scoreBox">
            <p className="scoreHeaderText">SCORE</p>
            <p className="score" ref={scoreRef}>0</p>
          </div>
          <div className="highscoreBox">
            <p className="scoreHeaderText">HIGH SCORE</p>
            <p className="score" ref={highscoreRef}>0</p>
          </div>
        </div>
        <div className="topContainerBtm">
          <button className="share">
            <a href={`https://twitter.com/intent/tweet?text=${twitterText}`} ><img src="/icons/share.png" alt="share" /></a>
          </button>
          <button className="help" onClick={handleHelp}>
            <img src="/icons/help.png" alt="help" />
          </button>
          <button className="back" onClick={handleUndo}>
            <img src="/icons/back.png" alt="back" />
          </button>
          <button className="reset" onClick={resetGame}>
            <img src="/icons/reset.png" alt="reset" />
          </button>
        </div>
      </div>
      <div className="container">
        <div className="gridContainerBack">
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
          <div className="itemBack" />
        </div>
        <div className="gridContainer">
          {itemsProps.map((props, index) => {
            return <animated.div key={index} className="item" style={{
              x: props.x,
              y: props.y,
              scale: props.scale,
              background: props.background,
              opacity: props.opacity,
              zIndex: props.zIndex,
              color: props.color
            }}>
              {props.value}
            </animated.div>
          })}
        </div>
        <animated.div {...bind()} className="containerSwipe" />
        <div ref={gameOverRef} className="containerGameOver">
          <h1>Game Over!</h1>
        </div>
        <div ref={winRef} className="containerWin" onClick={handleContinue}>
          <h1>🎉 You win! 🎉</h1>
          <p>Tap to continue</p>
        </div>
        <div ref={helpRef} className="containerHelp" onClick={handleHelp}>
          <ul>
            <li>
              2048 is a game where you combine numbered tiles to make a higher numbered tile. You start with two tiles, the lowest possible number is two.
            </li>
            <li>
              Move by swiping or using the arrow keys on a PC.
              Each time you move the tiles, another tile pops up ramdomly.
            </li>
            <li>
              By making two tiles with the same number collide on one another they will merge into one tile with the sum of the numbers. You can undo your last move.
            </li>
            <li>
              The goal is to combine tiles until you get a 2048 tile. After winning, you can choose to continue even further.
            </li>
          </ul>
          <p>Tap to continue</p>
        </div>
      </div>
      {/* <div className="controls">
        <button onClick={() => handleMove(0)}>Left</button>
        <button onClick={() => handleMove(1)}>Top</button>
        <button onClick={() => handleMove(2)}>Right</button>
        <button onClick={() => handleMove(3)}>Bottom</button>
      </div> */}
      <style jsx global>
        {`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          user-select: none;
        }
        
        body {
          background: #faf8f0;
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          flex-flow: column nowrap;
          overscroll-behavior-y: none;
          touch-action: none;
        }

        .controls {
          max-width: 300px;
          margin: 0 auto;
          text-align: center;
        }

        .topContainer {
          margin: 50px auto 0;
          width: 310px;
        }

        .topContainerTop {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .topContainerTop .title {
          font-family: sans-serif;
          font-size: 2.75rem;
          margin-right: auto;
          font-weight: 400;
          color: #777;
        }

        .scoreBox, .highscoreBox {
          font-family: sans-serif;
          background: #bcada1;
          border-radius: 4px;
          color: white;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
          padding: 0.25rem 0.5rem;
        }

        .scoreBox {
          margin-right: 10px;
        }

        .scoreBox .scoreHeaderText, .highscoreBox .scoreHeaderText{
          font-size: 0.65rem;
          letter-spacing: 0.01rem;
          color: #dedede;
        }

        .scoreBox .score, .highscoreBox .score {
          font-size: 1.2rem;
        }

        .topContainerBtm {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 1rem 0;
        }

        .topContainerBtm .share, .topContainerBtm .help,.topContainerBtm .back, .topContainerBtm .reset {
          color: #eee;
          width: 35px;
          height: 35px;
          border-radius: 4px;
          border: none;
          background: #bcada1;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .topContainerBtm .share {
          margin-right: auto;
        }

        .topContainerBtm .share a{
          color: #eee;
          width: 35px;
          height: 35px;
          border-radius: 4px;
          border: none;
          background: #bcada1;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .topContainerBtm .help, .topContainerBtm .back {
          margin-right: 25px;
        }

        .topContainerBtm .share img, .topContainerBtm .help img, .topContainerBtm .back img, .topContainerBtm .reset img{
          object-fit: contain;
          width: 18px;
          height: 18px;
        }

        .topContainerBtm .share:hover,.topContainerBtm .help:hover, .topContainerBtm .back:hover, .topContainerBtm .reset:hover,
        .topContainerBtm .share:focus, .topContainerBtm .back:focus, .topContainerBtm .reset:focus {
          opacity: 0.85;
        }

        .container {
          position: relative;
          margin: 0 auto;
          width: 310px;
          height: 310px;
        }

        .containerSwipe {
          position: absolute;
          width: 550px;
          top: 0;
          left: -120px;
          height: 405px;
          background: rgba(177, 136, 136, 0.5);
          border: 1px solid red;
          margin: 0 auto;
          z-index: 2000;
          opacity: 0;
        }

        .containerGameOver {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(177, 136, 136, 0.5);
          padding: 5px;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
          color: black;
          font-family: sans-serif;
          border-radius: 8px;
          margin: 0 auto;
          z-index: -1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .showGameOver{
          z-index: 2048;
          opacity: 1;
        }

        .gridContainerBack {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgb(177, 136, 136);
          padding: 5px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-radius: 8px;
        }
        
        .itemBack {
          width: 65px;
          height: 65px;
          margin: 5px;
          background: rgb(236, 206, 206);
          border-radius: 4px;
        }
        
        .gridContainer {
          position: absolute;
          width: 100%;
          height: 100%;
          background: none;
          padding: 5px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-radius: 8px;
        }
        
        .item {
          position: absolute;
          left: 5px;
          top: 5px;
          width: 65px;
          height: 65px;
          margin: 5px;
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.6rem;
          font-family: sans-serif;
        }

        .containerWin {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(255, 205, 205, 0.6);
          padding: 5px;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
          color: black;
          font-family: sans-serif;
          border-radius: 8px;
          margin: 0 auto;
          z-index: -1000;
          opacity: 0;
          transition: opacity 0.5s ease-in;
        }
        
        .containerWin p{
          margin-top: 2.5rem;
          font-size: 1.25rem;
        }

        .showWin {
          z-index: 2048;
          opacity: 1;
        }

        .containerHelp {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgb(255, 205, 205);
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
          color: black;
          font-family: sans-serif;
          border-radius: 8px;
          margin: 0 auto;
          z-index: -1000;
          opacity: 0;
          overflow: hidden;
          padding: 1rem;
        }
        .containerHelp ul {
          margin-top: 0.5rem;
          list-style: disc inside;
          font-size: 0.9rem;
        }
        
        .containerHelp ul li {
          margin-bottom: 0.5rem;
        }
        .containerHelp p {
          font-weight: bold;
        }


        .showHelp {
          opacity: 0.95;
          z-index: 8402
        }

        .controls button {
          padding: 1rem;
        }        
        `}
      </style>
    </main >
  )
}

export default Game2048