const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const projectRoot = path.resolve(__dirname, '..');
const { statistics: statisticsChannelId } = require(path.join(projectRoot, 'config', 'channels.json'));
const { files, readHistory, readTrend, readSchedule } = require('./lib/state');

// Create a new client instance with necessary intents and mobile status
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES
  ],
  ws: {
    properties: {
      $browser: 'Discord iOS'
    }
  }
});

// Command collection
client.commands = new Collection();

let statsChannel;
const lastExecutedPath = files.history;
const schedulePath = files.schedule;

// Function to read the last_executed.json file
// Ready event - runs when the bot is connected
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Fetch the statistics channel
  statsChannel = await client.channels.fetch(statisticsChannelId);
  
  // Send initial statistics
  sendStatistics();
  
  // Set up file watchers
  setupFileWatcher();
  setupScheduleWatcher();
});

// Set up a file watcher to monitor changes to last_executed.json
function setupFileWatcher() {
  try {
    // Use a debounce mechanism to prevent multiple calls
    let timeoutId = null;
    let lastModified = fs.existsSync(lastExecutedPath) ? fs.statSync(lastExecutedPath).mtime.getTime() : 0;
    
    // Check for file changes every 5 seconds
    setInterval(() => {
      try {
        const stats = fs.statSync(lastExecutedPath);
        const currentModified = stats.mtime.getTime();
        
        // If the file has been modified
        if (currentModified > lastModified) {
          console.log('Detected changes in last_executed.json');
          lastModified = currentModified;
          
          // Clear any existing timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Wait 2 seconds before sending statistics to ensure file is fully written
          timeoutId = setTimeout(() => {
            console.log('Sending updated statistics...');
            sendStatistics();
            timeoutId = null;
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking file changes:', error);
      }
    }, 5000);
    
    console.log('File watcher set up for last_executed.json');
  } catch (error) {
    console.error('Error setting up file watcher:', error);
  }
}

// Set up a file watcher to monitor changes to schedule.json
function setupScheduleWatcher() {
  try {
    // Use a debounce mechanism to prevent multiple calls
    let timeoutId = null;
    let lastModified = 0;
    
    try {
      lastModified = fs.statSync(schedulePath).mtime.getTime();
    } catch (error) {
      console.log('schedule.json does not exist yet, will create on first run');
    }
    
    // Check for file changes every 5 seconds
    setInterval(() => {
      try {
        const stats = fs.statSync(schedulePath);
        const currentModified = stats.mtime.getTime();
        
        // If the file has been modified
        if (currentModified > lastModified) {
          console.log('Detected changes in schedule.json');
          lastModified = currentModified;
          
          // Clear any existing timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Wait 2 seconds before sending statistics to ensure file is fully written
          timeoutId = setTimeout(() => {
            console.log('Sending updated statistics with new schedule...');
            sendStatistics();
            timeoutId = null;
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking schedule.json file changes:', error);
      }
    }, 5000);
    
    console.log('File watcher set up for schedule.json');
  } catch (error) {
    console.error('Error setting up schedule file watcher:', error);
  }
}

// Function to send statistics as an embed
async function sendStatistics() {
  try {
    // Get all historical data
    const allData = readHistory();
    
    if (allData.length === 0) {
      console.log('No previous bump data found.');
      return;
    }
    
    // Get the latest entry
    const lastData = allData[allData.length - 1];
    
    if (!lastData.timestamp) {
      console.log('Invalid bump data found.');
      return;
    }
    
    const lastTimestamp = new Date(lastData.timestamp);
    const currentMembers = lastData.guild.member;
    const memberDiff = lastData.guild.new;
  
    // Get daily trend data
    const trendData = readTrend();
    const dailyStats = trendData.dailyStats;
  
    // Calculate daily growth trends
    let growthTrend = '';
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  
    if (dailyStats[today]) {
      const todayStats = dailyStats[today];
      const bumpCount = todayStats.bumpCount;
      const startCount = todayStats.startCount;
      const currentCount = todayStats.currentCount;
      const netGain = currentCount - startCount;
      
      growthTrend = `**Today's Stats**\n- Members: \`${startCount}\` → \`${currentCount}\` (\`${netGain >= 0 ? '+' + netGain : netGain}\`)\n- Bump Count: \`${bumpCount}\``;
    } else if (Object.keys(dailyStats).length > 0) {
      // If no data for today, show the most recent day
      const dates = Object.keys(dailyStats).sort();
      const lastDate = dates[dates.length - 1];
      const lastStats = dailyStats[lastDate];
      const netChange = lastStats.currentCount - lastStats.startCount;
      
      growthTrend = `**Last Active Day** (${lastDate}):\n- Members: \`${lastStats.startCount}\` → \`${lastStats.currentCount}\` (\`${netChange >= 0 ? '+' + netChange : netChange}\`)\n- Bump Count: \`${lastStats.bumpCount}\``;
    }
  
    // Get next scheduled bump time
    const scheduleData = readSchedule();
    let nextBumpInfo = '';
    
    if (scheduleData && scheduleData.nextBumpTime) {
      const nextBumpTime = new Date(scheduleData.nextBumpTime);
      const randomMinutes = scheduleData.randomMinutes;
      nextBumpInfo = `Next bump: ${nextBumpTime.toLocaleString('en-US')} (with ${randomMinutes} min random delay)`;
    }
    
    // Create an embed with the statistics
    const statsEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Bump Statistics')
      .setDescription(`Last bump: ${lastTimestamp.toLocaleString('en-US')}\n${nextBumpInfo}`)
      .addFields(
        { name: 'Current Member Count', value: `> \`${currentMembers}\``, inline: true },
        { name: 'Change', value: `> \`${memberDiff >= 0 ? '+' + memberDiff : memberDiff}\``, inline: true }
      )
      .setTimestamp();
  
    // Add daily growth trend if available
    if (growthTrend) {
      statsEmbed.addField('Daily Growth', `${growthTrend}`, false);
    }
  
    // Add historical data if we have enough entries
    if (allData.length >= 3) {
      // Get the last 3 entries (excluding the current one)
      const recentEntries = allData.slice(-4, -1);
      let historyText = '```';
  
      recentEntries.forEach(entry => {
        const entryDate = new Date(entry.timestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        historyText += `${entryDate}: ${entry.guild.member} (${entry.guild.new >= 0 ? '+' + entry.guild.new : entry.guild.new})\n`;
      });
      
      historyText += '```';
  
      statsEmbed.addField('Recent History', historyText, false);
    }
  
    statsEmbed.setFooter({ text: 'The next bump is scheduled in 2 hours' });
  
    
    // Send the embed to the statistics channel
    await statsChannel.send({ embeds: [statsEmbed] });
    console.log('Sent statistics to the channel.');
  } catch (error) {
    console.error('Error sending statistics:', error);
  }
}

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);
