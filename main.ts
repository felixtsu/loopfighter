namespace SpriteKind {
    export const TimeTravelPlayer = SpriteKind.create()
}
enum ActionList{
    UP, DOWN, LEFT, RIGHT, DESTROY
}
interface ActionTimestamp {
    timestamp :number
    action : ActionList
}
class StoredPlayerActivity {
    activities:ActionTimestamp[]
    public constructor() {
        this.activities = []
    }
    push(action:ActionList, timestamp:number) {
        this.activities.push({
            timestamp : timestamp, 
            action : action
        })
    }
}
class TimeTravelPlayer {
    private playerSprite :Sprite
    activities:ActionTimestamp[]
    private destroyed : boolean
    public constructor(storedPlayerActivity : StoredPlayerActivity) {
        this.playerSprite = sprites.create(img`
            ..ccc.........dddddd....
            ..d4cc.......dcc33dd....
            ..d44cc...dddccccdd.....
            ..d344cccc33334443cc....
            ..d334cc3333333344b9c...
            ..cf3333333333333b999c..
            .c33c333333333b11199b3c.
            d33ccccccc333399111b333c
            dddddcc333c333333333333d
            .....d3333443333333333d.
            ....d333344dc3333333dd..
            ...c333344dddddddddd....
            ...c3333cdddc3d.........
            ...dddddddd3ccd.........
            .......dddd3cd..........
            ........ddddd...........
        `, SpriteKind.TimeTravelPlayer)
        this.playerSprite.setFlag(SpriteFlag.StayInScreen, true)
        this.playerSprite.x = 32
        this.activities = storedPlayerActivity.activities
    }
    
    public say(text:string) {
        this.playerSprite.say(text)
    }

    public up() {
        this.playerSprite.vx = 0
        this.playerSprite.vy = -50
    }
    public down() {
        this.playerSprite.vx = 0
        this.playerSprite.vy = 50
    }
    public left() {
        this.playerSprite.vx = -50
        this.playerSprite.vy = 0
    }
    public right() {
        this.playerSprite.vx = 50
        this.playerSprite.vy = 0
    }

    public destroy() {
        this.playerSprite.say("Escaping to another timeline, good luck", 2000)
        this.playerSprite.destroy(effects.spray, 2000)
        this.playerSprite.vx = 0
        this.playerSprite.vy = 0
        this.destroyed = true
    }

    public fire() {
        if (!this.destroyed) {
            sprites.createProjectileFromSprite(img`
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . 2 5 1 1 . . 2 5 1 1 . . .
            . . . 2 5 1 1 . . 2 5 1 1 . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . 2 5 1 1 . . 2 5 1 1 . . .
            . . . 2 5 1 1 . . 2 5 1 1 . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
        `, this.playerSprite, 100, 0)
        }
        
    }
}
namespace engine {

    let currentTimelineTimeStamp:number = 0;

    let storedPlayerActivities : StoredPlayerActivity[] = []
    let playersInOtherTimeline : TimeTravelPlayer[]
    let currentPlayerActivityLogger : StoredPlayerActivity = null
    let playerSprite :Sprite = null

    let init = false
    let destoryedUniverse = 0

    function endGame() {
        destoryedUniverse++
        game.showLongText("Heavy damage taken", DialogLayout.Bottom)
        game.showLongText("Opening wormhole to another timeline", DialogLayout.Bottom)
        game.showLongText(destoryedUniverse + " universe(s) destroyed", DialogLayout.Bottom)

        currentPlayerActivityLogger.push(ActionList.DESTROY, game.runtime() - currentTimelineTimeStamp)
        storedPlayerActivities.push(currentPlayerActivityLogger)

        cubicbird.destroyAllSpriteOfKind(SpriteKind.Player)
        cubicbird.destroyAllSpriteOfKind(SpriteKind.Shark)
        cubicbird.destroyAllSpriteOfKind(SpriteKind.Projectile)
        cubicbird.destroyAllSpriteOfKind(SpriteKind.EnemyProjectile)
        cubicbird.destroyAllSpriteOfKind(SpriteKind.TimeTravelPlayer)
        
        restartGame()
    }

    function overlapHandle() {
        sprites.onOverlap(SpriteKind.Player, SpriteKind.EnemyProjectile, function(sprite: Sprite, otherSprite: Sprite) {
            endGame()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Shark, function(sprite: Sprite, otherSprite: Sprite) {
            endGame()
        })

        sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Shark, function(sprite: Sprite, otherSprite: Sprite) {
            info.changeScoreBy(1)
            otherSprite.startEffect(effects.spray, 200)
            sprite.destroy()
            if(shark.takeDamage(1)){
                game.showLongText("You've save us all, at " + destoryedUniverse + " universe(s)'s cost", DialogLayout.Bottom)
                game.over(true)
            }
        })
    }

    function bindControl() {
        controller.up.onEvent(ControllerButtonEvent.Pressed, function() {
            currentPlayerActivityLogger.push(ActionList.UP, game.runtime() - currentTimelineTimeStamp)
            playerSprite.vy = -50
            playerSprite.vx = 0
        })
        controller.down.onEvent(ControllerButtonEvent.Pressed, function() {
            currentPlayerActivityLogger.push(ActionList.DOWN, game.runtime() - currentTimelineTimeStamp)
            playerSprite.vy = 50
            playerSprite.vx = 0
        })
        controller.left.onEvent(ControllerButtonEvent.Pressed, function() {
            currentPlayerActivityLogger.push(ActionList.LEFT, game.runtime() - currentTimelineTimeStamp)
            playerSprite.vy = 0
            playerSprite.vx = -50
        })
        controller.right.onEvent(ControllerButtonEvent.Pressed, function() {
            currentPlayerActivityLogger.push(ActionList.RIGHT, game.runtime() - currentTimelineTimeStamp)
            playerSprite.vy = 0
            playerSprite.vx = 50
        })
    }

    function dumpActivities(activities:ActionTimestamp[]) {
        let log = ""
        for (let activity of activities) {
            log += activity.timestamp + ":" + activity.action + ";"
        }
        console.log(log)
    }

    function summonPlayersInOtherTimeline() {
        playersInOtherTimeline = []
        for (let storedPlayerActivity of storedPlayerActivities) {
            playersInOtherTimeline.push(new TimeTravelPlayer(storedPlayerActivity))
        }
    }

    class MoveHandler {
        private currentActionIndice:number[]
        private currentTimelineTimeStamp:number
        static INSTANCE = new MoveHandler()

        reset(currentTimelineTimeStamp: number, length:number) {
            this.currentActionIndice = []
            this.currentTimelineTimeStamp = currentTimelineTimeStamp
            for (let i = 0 ; i < length; i++) {
                this.currentActionIndice.push(0)
            }
        }

        serve() {

            game.onUpdateInterval(1000, () =>  {
                let delta = game.runtime() - this.currentTimelineTimeStamp
                for (let j = 0 ; j < playersInOtherTimeline.length; j++) {
                    let anotherPlayer = playersInOtherTimeline[j]
                    anotherPlayer.say("" + Math.floor((anotherPlayer.activities[anotherPlayer.activities.length-1].timestamp - delta)/1000) )
                    while (this.currentActionIndice[j] < anotherPlayer.activities.length 
                        && anotherPlayer.activities[this.currentActionIndice[j]].timestamp < delta) {
                        let action = anotherPlayer.activities[this.currentActionIndice[j]].action
                        switch(action) {
                            case ActionList.UP: 
                                anotherPlayer.up() 
                                break;
                            case ActionList.DOWN: 
                                anotherPlayer.down() 
                                break;
                            case ActionList.LEFT: 
                                anotherPlayer.left() 
                                break;
                            case ActionList.RIGHT: 
                                anotherPlayer.right() 
                                break;
                            case ActionList.DESTROY: 
                                anotherPlayer.destroy() 
                                break;
                        }
                        this.currentActionIndice[j] = this.currentActionIndice[j] + 1
                    }
                }
            })
            
            game.onUpdate(() =>  {
                let delta = game.runtime() - this.currentTimelineTimeStamp
                for (let j = 0 ; j < playersInOtherTimeline.length; j++) {
                    let anotherPlayer = playersInOtherTimeline[j]
                    while (this.currentActionIndice[j] < anotherPlayer.activities.length 
                        && anotherPlayer.activities[this.currentActionIndice[j]].timestamp < delta) {
                        let action = anotherPlayer.activities[this.currentActionIndice[j]].action
                        switch(action) {
                            case ActionList.UP: 
                                anotherPlayer.up() 
                                break;
                            case ActionList.DOWN: 
                                anotherPlayer.down() 
                                break;
                            case ActionList.LEFT: 
                                anotherPlayer.left() 
                                break;
                            case ActionList.RIGHT: 
                                anotherPlayer.right() 
                                break;
                            case ActionList.DESTROY: 
                                anotherPlayer.destroy() 
                                break;
                        }
                        this.currentActionIndice[j] = this.currentActionIndice[j] + 1
                    }
                }
            })
        }
    }

    function moveHandler(initHandler:boolean) {
        MoveHandler.INSTANCE.reset(currentTimelineTimeStamp, playersInOtherTimeline.length)
        if (initHandler) {
            MoveHandler.INSTANCE.serve()
        }
    }
    
    function attackHandler() {
        game.onUpdateInterval(500, function() {
                for (let anotherPlayer2 of playersInOtherTimeline) {
                    anotherPlayer2.fire()
                }
                sprites.createProjectileFromSprite(img`
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . 2 5 1 1 . . 2 5 1 1 . . .
                . . . 2 5 1 1 . . 2 5 1 1 . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . 2 5 1 1 . . 2 5 1 1 . . .
                . . . 2 5 1 1 . . 2 5 1 1 . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                . . . . . . . . . . . . . . . .
                `, playerSprite, 100, 0)
            })
    }

    export function restartGame() {
        currentPlayerActivityLogger = new StoredPlayerActivity()
        currentTimelineTimeStamp = game.runtime()
        playerSprite = sprites.create(img`
            ..ccc.........ffffff....
            ..f4cc.......fcc22ff....
            ..f44cc...fffccccff.....
            ..f244cccc22224442cc....
            ..f224cc2222222244b9c...
            ..cf2222222222222b999c..
            .c22c222222222b11199b2c.
            f22ccccccc222299111b222c
            fffffcc222c222222222222f
            .....f2222442222222222f.
            ....f222244fc2222222ff..
            ...c222244ffffffffff....
            ...c2222cfffc2f.........
            ...ffffffff2ccf.........
            .......ffff2cf..........
            ........fffff...........
        `, SpriteKind.Player)
        playerSprite.x = 32
        playerSprite.z = 100
        playerSprite.setFlag(SpriteFlag.StayInScreen, true)
        bindControl()
        summonPlayersInOtherTimeline()

        moveHandler(!init)        
        shark.spawnBoss(playerSprite, !init)

        if (!init) {
            overlapHandle()
            attackHandler()

            init = true
        }
        
    }
}
engine.restartGame()
