function PrettyQuickSelect(list, left, right, n) {
    if (left == right)
        return list[left];
    while (true) {
        pivotIndex = left + ((right - left) >>> 1); // select pivotIndex between left and right
        pivotIndex = partition(list, left, right, pivotIndex);

        if (n == pivotIndex)
            return list[n];
        else if (n < pivotIndex)
            right = pivotIndex - 1;
        else
            left = pivotIndex + 1;
    }
}

function partition(list, left, right, pivotIndex) {
    var pivotValue = list[pivotIndex];
    swap(list, pivotIndex, right); // Move pivot to end
    pivotIndex = left;
    for (var i = left; i < right; i++) {
        if (list[i] <= pivotValue) {
            swap(list, pivotIndex, i);

            pivotIndex++;
        }
    }
    swap(list, right, pivotIndex); // Move pivot to its final place
    return pivotIndex
}

function swap(list, a, b) {
    var tmp = list[a];
    list[a] = list[b];
    list[b] = tmp;
}

function QuickSelect(list, left, right, n) {
    if (left == right)
        return list[left];
    var tmp;
    while (true) {
        pivotIndex = left + ((right - left) >>> 1); // select pivotIndex between left and right

        var pivotValue = list[pivotIndex];
        // Move pivot to end
        tmp = list[pivotIndex];
        list[pivotIndex] = list[right];
        list[right] = tmp;
        pivotIndex = left;
        for (var i = left; i < right; i++) {
            if (list[i] <= pivotValue) {
                //swap
                tmp = list[pivotIndex];
                list[pivotIndex] = list[i];
                list[i] = tmp;
                pivotIndex++;
            }
        }
        // Move pivot to its final place
        tmp = list[right];
        list[right] = list[pivotIndex];
        list[pivotIndex] = tmp;

        if (n == pivotIndex)
            return list[n];
        else if (n < pivotIndex)
            right = pivotIndex - 1;
        else
            left = pivotIndex + 1;
    }
}