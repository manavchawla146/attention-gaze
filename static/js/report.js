/**
 * Pomodoro Focus Zone - Report Generator
 * Handles PDF report generation with charts and visualizations
 */

class ReportGenerator {
    constructor() {
        this.sessionData = null;
    }
    
    generateReport(sessionData) {
        this.sessionData = sessionData;
        
        // For now, create a comprehensive text report
        // In a production app, you would use jsPDF or similar for PDF generation
        return this.createComprehensiveReport();
    }
    
    createComprehensiveReport() {
        const data = this.sessionData;
        const breaks = data.attention_breaks || [];
        
        // Calculate statistics
        const totalDuration = (data.total_focus_time || 0) + (data.total_break_time || 0);
        const focusPercentage = data.focus_percentage || 0;
        const totalBreaks = breaks.length;
        const totalBreakTime = breaks.reduce((sum, break_) => sum + (break_.duration_seconds || 0), 0);
        const avgBreakDuration = totalBreaks > 0 ? totalBreakTime / totalBreaks : 0;
        const longestBreak = breaks.length > 0 ? Math.max(...breaks.map(b => b.duration_seconds || 0)) : 0;
        const shortestBreak = breaks.length > 0 ? Math.min(...breaks.map(b => b.duration_seconds || 0)) : 0;
        
        // Calculate focus periods (inverse of breaks)
        const focusPeriods = this.calculateFocusPeriods(breaks, totalDuration);
        const avgFocusDuration = focusPeriods.length > 0 ? 
            focusPeriods.reduce((sum, period) => sum + period.duration, 0) / focusPeriods.length : 0;
        const longestFocus = focusPeriods.length > 0 ? 
            Math.max(...focusPeriods.map(p => p.duration)) : 0;
        const shortestFocus = focusPeriods.length > 0 ? 
            Math.min(...focusPeriods.map(p => p.duration)) : 0;
        
        let report = this.generateHeader();
        report += this.generateSessionOverview(data, totalDuration, focusPercentage);
        report += this.generateFocusAnalysis(focusPeriods, avgFocusDuration, longestFocus, shortestFocus);
        report += this.generateBreakAnalysis(breaks, totalBreaks, avgBreakDuration, longestBreak, shortestBreak);
        report += this.generateDetailedTables(focusPeriods, breaks);
        report += this.generateTimeline(breaks, focusPeriods);
        report += this.generatePerformanceInsights(focusPercentage, totalBreaks, avgBreakDuration);
        report += this.generateFooter();
        
        return report;
    }
    
    generateHeader() {
        const timestamp = new Date().toLocaleString();
        return `================================================================================
COMPREHENSIVE ATTENTION ANALYSIS REPORT
Generated: ${timestamp}
================================================================================

`;
    }
    
    generateSessionOverview(data, totalDuration, focusPercentage) {
        const startTime = new Date(data.start_time).toLocaleString();
        const endTime = new Date(data.end_time).toLocaleString();
        
        return `SESSION OVERVIEW
--------------------------------------------------
Session Start: ${startTime}
Session End: ${endTime}
Total Duration: ${this.formatDuration(totalDuration)}
Attention Percentage: ${focusPercentage.toFixed(1)}%
Total Focus Time: ${this.formatDuration(data.total_focus_time || 0)}
Total Break Time: ${this.formatDuration(data.total_break_time || 0)}
Focus Efficiency: ${this.calculateEfficiency(focusPercentage)}

`;
    }
    
    generateFocusAnalysis(focusPeriods, avgDuration, longest, shortest) {
        return `FOCUS ANALYSIS
--------------------------------------------------
Number of Focus Zones: ${focusPeriods.length}
Average Focus Duration: ${avgDuration.toFixed(1)} seconds (${(avgDuration/60).toFixed(2)} minutes)
Longest Focus Period: ${longest.toFixed(1)} seconds (${(longest/60).toFixed(2)} minutes)
Shortest Focus Period: ${shortest.toFixed(1)} seconds (${(shortest/60).toFixed(2)} minutes)
Focus Consistency: ${this.calculateConsistency(focusPeriods)}

`;
    }
    
    generateBreakAnalysis(breaks, totalBreaks, avgDuration, longest, shortest) {
        return `ATTENTION BREAK ANALYSIS
--------------------------------------------------
Number of Attention Breaks: ${totalBreaks}
Average Break Duration: ${avgDuration.toFixed(1)} seconds (${(avgDuration/60).toFixed(2)} minutes)
Longest Break: ${longest.toFixed(1)} seconds (${(longest/60).toFixed(2)} minutes)
Shortest Break: ${shortest.toFixed(1)} seconds (${(shortest/60).toFixed(2)} minutes)
Break Frequency: ${this.calculateBreakFrequency(breaks)}
Distraction Level: ${this.calculateDistractionLevel(totalBreaks, avgDuration)}

`;
    }
    
    generateDetailedTables(focusPeriods, breaks) {
        let report = `DETAILED FOCUS ZONES
--------------------------------------------------
#   Start Time           End Time             Duration (s)    Duration (min) 
--------------------------------------------------------------------------------`;
        
        focusPeriods.forEach((period, index) => {
            const startTime = new Date(period.start_time).toLocaleTimeString();
            const endTime = new Date(period.end_time).toLocaleTimeString();
            report += `\n${(index + 1).toString().padStart(3, ' ')}   ${startTime.padEnd(20)} ${endTime.padEnd(20)} ${period.duration.toFixed(1).padStart(15)} ${(period.duration/60).toFixed(2).padStart(15)}`;
        });
        
        report += `\n\nDETAILED ATTENTION BREAKS
--------------------------------------------------
#   Start Time           End Time             Duration (s)    Duration (min) 
--------------------------------------------------------------------------------`;
        
        breaks.forEach((break_, index) => {
            const startTime = new Date(break_.start_time).toLocaleTimeString();
            const endTime = new Date(break_.end_time).toLocaleTimeString();
            const duration = break_.duration_seconds || 0;
            report += `\n${(index + 1).toString().padStart(3, ' ')}   ${startTime.padEnd(20)} ${endTime.padEnd(20)} ${duration.toFixed(1).padStart(15)} ${(duration/60).toFixed(2).padStart(15)}`;
        });
        
        return report + '\n\n';
    }
    
    generateTimeline(breaks, focusPeriods) {
        let report = `ATTENTION TIMELINE
--------------------------------------------------`;
        
        // Combine and sort all events
        const allEvents = [];
        
        // Add focus periods
        focusPeriods.forEach(period => {
            allEvents.push({
                type: 'FOCUS',
                start: new Date(period.start_time),
                end: new Date(period.end_time),
                action: 'START'
            });
            allEvents.push({
                type: 'FOCUS',
                start: new Date(period.start_time),
                end: new Date(period.end_time),
                action: 'END'
            });
        });
        
        // Add breaks
        breaks.forEach(break_ => {
            allEvents.push({
                type: 'BREAK',
                start: new Date(break_.start_time),
                end: new Date(break_.end_time),
                action: 'START'
            });
            allEvents.push({
                type: 'BREAK',
                start: new Date(break_.start_time),
                end: new Date(break_.end_time),
                action: 'END'
            });
        });
        
        // Sort by time
        allEvents.sort((a, b) => a.start - b.start);
        
        // Generate timeline
        allEvents.forEach(event => {
            const time = event.action === 'START' ? event.start : event.end;
            const timeStr = time.toLocaleTimeString();
            const actionStr = `${event.type} ${event.action}`;
            report += `\n${timeStr} - ${actionStr}`;
        });
        
        return report + '\n\n';
    }
    
    generatePerformanceInsights(focusPercentage, totalBreaks, avgBreakDuration) {
        let insights = `PERFORMANCE INSIGHTS
--------------------------------------------------`;
        
        // Focus level assessment
        if (focusPercentage >= 85) {
            insights += `\n✅ Exceptional attention level - outstanding focus maintained!`;
        } else if (focusPercentage >= 70) {
            insights += `\n👍 Excellent attention level - great concentration skills`;
        } else if (focusPercentage >= 55) {
            insights += `\n🎯 Good attention level - room for improvement`;
        } else if (focusPercentage >= 40) {
            insights += `\n⚠️ Moderate attention level - consider focus strategies`;
        } else {
            insights += `\n❌ Low attention level - significant distractions detected`;
        }
        
        // Break frequency assessment
        if (totalBreaks > 30) {
            insights += `\n🔄 Very high frequency of focus changes - may indicate difficulty maintaining concentration`;
        } else if (totalBreaks > 20) {
            insights += `\n🔄 High frequency of focus changes - consider longer focus blocks`;
        } else if (totalBreaks > 10) {
            insights += `\n📊 Moderate focus change frequency - normal pattern`;
        } else {
            insights += `\n💪 Low frequency of focus changes - excellent sustained attention`;
        }
        
        // Break duration assessment
        if (avgBreakDuration > 30) {
            insights += `\n⏰ Long average break duration - breaks may be too extended`;
        } else if (avgBreakDuration > 15) {
            insights += `\n⏱️ Moderate break duration - reasonable balance`;
        } else if (avgBreakDuration > 5) {
            insights += `\n⚡ Short break duration - quick recovery pattern`;
        } else {
            insights += `\n🚀 Very short breaks - minimal distraction recovery`;
        }
        
        // Recommendations
        insights += `\n\nRECOMMENDATIONS
--------------------------------------------------`;
        
        if (focusPercentage < 70) {
            insights += `\n• Consider using the Pomodoro technique with shorter focus blocks`;
            insights += `\n• Minimize environmental distractions`;
            insights += `\n• Try mindfulness exercises to improve concentration`;
        }
        
        if (totalBreaks > 25) {
            insights += `\n• Practice sustained attention with gradually increasing focus periods`;
            insights += `\n• Identify and eliminate common distraction triggers`;
        }
        
        if (avgBreakDuration > 20) {
            insights += `\n• Set timers for breaks to prevent over-extension`;
            insights += `\n• Use break time for quick stretching or hydration`;
        }
        
        insights += `\n• Continue tracking to monitor improvement trends`;
        insights += `\n• Celebrate progress and maintain consistent practice`;
        
        return insights;
    }
    
    generateFooter() {
        return `\n================================================================================
Thank you for using Pomodoro Focus Zone!
Keep working on your focus and attention skills.
================================================================================
`;
    }
    
    calculateFocusPeriods(breaks, totalDuration) {
        const focusPeriods = [];
        
        if (breaks.length === 0) {
            // No breaks - entire session was focused
            focusPeriods.push({
                start_time: this.sessionData.start_time,
                end_time: this.sessionData.end_time,
                duration: totalDuration
            });
            return focusPeriods;
        }
        
        // Calculate focus periods between breaks
        let previousEnd = new Date(this.sessionData.start_time);
        
        breaks.forEach(break_ => {
            const breakStart = new Date(break_.start_time);
            
            if (breakStart > previousEnd) {
                focusPeriods.push({
                    start_time: previousEnd.toISOString(),
                    end_time: breakStart.toISOString(),
                    duration: (breakStart - previousEnd) / 1000
                });
            }
            
            previousEnd = new Date(break_.end_time);
        });
        
        // Check for focus period after last break
        const sessionEnd = new Date(this.sessionData.end_time);
        if (sessionEnd > previousEnd) {
            focusPeriods.push({
                start_time: previousEnd.toISOString(),
                end_time: sessionEnd.toISOString(),
                duration: (sessionEnd - previousEnd) / 1000
            });
        }
        
        return focusPeriods;
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s (${(seconds/60).toFixed(1)} minutes)`;
        } else {
            return `${minutes}m ${secs}s (${(seconds/60).toFixed(1)} minutes)`;
        }
    }
    
    calculateEfficiency(focusPercentage) {
        if (focusPercentage >= 85) return 'Excellent';
        if (focusPercentage >= 70) return 'Very Good';
        if (focusPercentage >= 55) return 'Good';
        if (focusPercentage >= 40) return 'Fair';
        return 'Needs Improvement';
    }
    
    calculateConsistency(focusPeriods) {
        if (focusPeriods.length === 0) return 'No Data';
        
        const durations = focusPeriods.map(p => p.duration);
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
        const stdDev = Math.sqrt(variance);
        
        const coefficientOfVariation = (stdDev / avg) * 100;
        
        if (coefficientOfVariation < 30) return 'Very Consistent';
        if (coefficientOfVariation < 50) return 'Consistent';
        if (coefficientOfVariation < 70) return 'Variable';
        return 'Inconsistent';
    }
    
    calculateBreakFrequency(breaks) {
        const sessionDuration = (new Date(this.sessionData.end_time) - new Date(this.sessionData.start_time)) / 1000;
        const breaksPerHour = (breaks.length / sessionDuration) * 3600;
        
        if (breaksPerHour > 20) return 'Very High';
        if (breaksPerHour > 15) return 'High';
        if (breaksPerHour > 10) return 'Moderate';
        if (breaksPerHour > 5) return 'Low';
        return 'Very Low';
    }
    
    calculateDistractionLevel(totalBreaks, avgDuration) {
        const distractionScore = totalBreaks * (avgDuration / 10);
        
        if (distractionScore > 50) return 'Severe';
        if (distractionScore > 30) return 'High';
        if (distractionScore > 15) return 'Moderate';
        if (distractionScore > 5) return 'Low';
        return 'Minimal';
    }
    
    // Method to download the report as a text file
    downloadReport(content, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '');
            filename = `pomodoro_focus_report_${timestamp}.txt`;
        }
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    // Method to generate and download PDF (placeholder for future implementation)
    async generatePDFReport(sessionData) {
        // This would be implemented with jsPDF or similar library
        console.log('PDF generation would be implemented here');
        
        // For now, generate text report
        const reportContent = this.generateReport(sessionData);
        this.downloadReport(reportContent);
    }
}

// Initialize report generator
document.addEventListener('DOMContentLoaded', () => {
    window.reportGenerator = new ReportGenerator();
});
