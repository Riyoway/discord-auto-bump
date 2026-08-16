const { Client } = require('discord.js-selfbot-v13')
const client = new Client()
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const projectRoot = path.resolve(__dirname, '..');
const { bump: bumpChannelId } = require(path.join(projectRoot, 'config', 'channels.json'));
const services = require(path.join(projectRoot, 'config', 'services.json'));
const { readHistory, appendHistory, readTrend, writeTrend, writeSchedule } = require('./lib/state');

let channel;

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)

    channel = await client.channels.fetch(bumpChannelId)

    bump()
})

function readLastExecuted() {
    const history = readHistory();
    return history.at(-1) || { timestamp: '', guild: { member: 0, new: 0 } };
}


function updateDailyTrend(memberCount, memberDiff) {
    try {
        const today = new Date().toLocaleDateString('en-CA');
        const trendData = readTrend();
        
        if (!trendData.dailyStats[today]) {
            trendData.dailyStats[today] = {
                startCount: memberCount,
                currentCount: memberCount,
                totalGain: 0,
                bumpCount: 0
            };
        }
        
        const todayStats = trendData.dailyStats[today];
        todayStats.currentCount = memberCount;
        todayStats.totalGain += memberDiff > 0 ? memberDiff : 0;
        todayStats.bumpCount++;
        
        writeTrend(trendData);
        
        console.log(`Updated daily trend for ${today}: Current: ${memberCount}, Total Gain: ${todayStats.totalGain}`);
    } catch (error) {
        console.error('Error updating daily trend:', error);
    }
}

function writeLastExecuted(newData) {
    appendHistory(newData);
}

async function bump() {
    try {
        const lastData = readLastExecuted();
        
        const guild = channel.guild;
        const currentMembers = guild.memberCount;
        
        for (const bot of Object.values(services)) {
            if (!bot.enable) continue;
            
            // Handle both string and object command formats
            const bumpCommand = typeof bot.commands.bump === 'object' 
                ? bot.commands.bump.name 
                : bot.commands.bump;
                
            await channel.sendSlash(bot.id, bumpCommand);
        }
        const newData = {
            timestamp: new Date().toISOString(),
            guild: {
                member: currentMembers,
                new: lastData.timestamp ? currentMembers - lastData.guild.member : 0
            }
        };
        
        writeLastExecuted(newData);
        
        updateDailyTrend(currentMembers, newData.guild.new);
        
        console.log(`Guild member count: ${currentMembers} (Change: ${newData.guild.new})`);
        
    } catch (error) {
        console.error('Error bumping bots:', error);
    }
    
    console.count('Successfully Bumped!');

    // Generate random minutes (1-10) to add to the 2-hour interval
    const randomMinutes = Math.floor(Math.random() * 10) + 1;
    const randomDelay = randomMinutes * 60 * 1000; // Convert to milliseconds
    const baseDelay = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const totalDelay = baseDelay + randomDelay;
    
    const nextBumpTime = new Date(Date.now() + totalDelay);
    console.log(`Next bump scheduled at: ${nextBumpTime.toLocaleString()} (with ${randomMinutes} minutes random delay)`);
    
    // Save the next scheduled time to a file for bot.js to access
    try {
        writeSchedule({
            nextBumpTime: nextBumpTime.toISOString(),
            randomMinutes
        });
        console.log('Schedule saved for synchronization');
    } catch (error) {
        console.error('Error saving schedule:', error);
    }

    setTimeout(function () {
        bump();
    }, totalDelay);
}

client.login(process.env.USER_TOKEN)
