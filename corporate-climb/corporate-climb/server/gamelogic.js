class GameSession {
    constructor(roomId, hostId, mode = 'MULTIPLAYER') {
        this.roomId = roomId;
        this.players = {}; // Store player stats (Rep, Skill, Role)
        this.turn = 1;
        this.cycle = 1; // 12 turns = 1 cycle
        this.mode = mode; // 'SINGLE' or 'MULTI'
        this.events = []; // Active crisis events
        
        // Add Host
        this.addPlayer(hostId, "Human");

        // If Single Player, immediately add Bots
        if (mode === 'SINGLE') {
            this.addBot("Bot_Karen_HR");
            this.addBot("Bot_Jim_Sales");
            this.addBot("Bot_Dwight_Eng");
        }
    }

    addPlayer(id, type) {
        this.players[id] = {
            id: id,
            type: type, // 'Human' or 'Bot'
            role: 'Junior Associate',
            dept: 'Sales', // Default
            stats: { energy: 100, skill: 10, repSolid: 0, repFlash: 0, stress: 0 }
        };
    }

    addBot(name) {
        const botId = name;
        this.addPlayer(botId, 'Bot');
        // Randomize Bot Stats slightly to create variety
        this.players[botId].stats.skill = Math.floor(Math.random() * 20);
    }

    processAction(playerId, actionType) {
        const p = this.players[playerId];
        // -- LOGIC FROM GDD GOES HERE --
        if (actionType === 'WORK_HARD') {
            p.stats.skill += 5;
            p.stats.energy -= 30;
        } else if (actionType === 'TAKE_CREDIT') {
            p.stats.repFlash += 10;
            p.stats.energy -= 20;
        }
        // Check if all humans have moved
        this.checkTurnEnd();
    }

    checkTurnEnd() {
        // Simple logic: If all humans have 0 energy or passed, end turn
        // For Bots: Simulate their moves instantly at end of turn
        Object.values(this.players).forEach(p => {
            if (p.type === 'Bot') this.simulateBotTurn(p);
        });
        
        this.turn++;
        // Trigger Crisis Event (RNG)
        // Send Update to Client
    }

    simulateBotTurn(bot) {
        // AI Logic: If Rep is low, Take Credit. If Skill is low, Work Hard.
        bot.stats.skill += 2; 
        bot.stats.repSolid += 1;
    }
// ... inside class GameSession ...

    evaluateCycle() {
        const promotionSlots = 1; // Only 1 person moves up per cycle
        const firingThreshold = 10; // Minimum Rep needed to survive
        const skillThresholdForPromo = 30; // Min skill to be considered for promo
        
        // 1. Group players by Role (Level)
        // We only compare Junior Associates with Junior Associates, etc.
        const levelGroups = {};
        
        Object.values(this.players).forEach(p => {
            if (!levelGroups[p.role]) levelGroups[p.role] = [];
            levelGroups[p.role].push(p);
        });

        const results = []; // To send back to client

        // 2. Process each Level
        for (const [role, roster] of Object.entries(levelGroups)) {
            // Sort by Total Reputation (Highest to Lowest)
            roster.sort((a, b) => {
                const repA = a.stats.repSolid + a.stats.repFlash;
                const repB = b.stats.repSolid + b.stats.repFlash;
                return repB - repA;
            });

            // --- FIRING LOGIC ---
            // The absolute bottom player is fired, OR anyone below threshold
            const bottomPlayer = roster[roster.length - 1];
            const bottomRep = bottomPlayer.stats.repSolid + bottomPlayer.stats.repFlash;

            if (bottomRep < firingThreshold) {
                bottomPlayer.status = 'FIRED';
                results.push(`${bottomPlayer.id} was fired for poor performance!`);
            }

            // --- PROMOTION LOGIC ---
            // Look at top players who aren't fired
            let promotedCount = 0;
            for (const p of roster) {
                if (p.status === 'FIRED') continue;
                if (promotedCount >= promotionSlots) break;

                // Check Skill Requirement
                if (p.stats.skill >= skillThresholdForPromo) {
                    p.role = this.getNextRole(p.role); // Helper function needed
                    p.status = 'PROMOTED';
                    results.push(`${p.id} was promoted to ${p.role}!`);
                    promotedCount++;
                    
                    // Reset Flash Rep on promotion (New job, new reputation needed)
                    p.stats.repFlash = 0; 
                }
            }
        }

        this.cycle++;
        this.turn = 1; // Reset week
        return results;
    }

    getNextRole(currentRole) {
        const ladder = ['Junior Associate', 'Senior Associate', 'Manager', 'Director', 'VP', 'CEO'];
        const idx = ladder.indexOf(currentRole);
        return (idx >= 0 && idx < ladder.length - 1) ? ladder[idx + 1] : currentRole;
    }
}

module.exports = { GameSession };