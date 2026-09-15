/**
 * Standard data formatters for duration, rates, and numbers.
 */

export function formatDuration(ms: number | null | undefined): string {
    if (ms == null || isNaN(ms) || ms <= 0) {
        return "0s";
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
}

export function formatRate(rate: number | null | undefined): string {
    if (rate == null || isNaN(rate)) {
        return "0.0%";
    }
    // Backend percentages are 0.0 to 100.0
    return `${rate.toFixed(1)}%`;
}

export function formatDecimal(val: number | null | undefined, precision = 1): string {
    if (val == null || isNaN(val)) {
        return "0.0";
    }
    return val.toFixed(precision);
}
