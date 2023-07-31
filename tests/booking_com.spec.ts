import { expect, test } from '@playwright/test';
import { addDays, formatISO, startOfToday } from 'date-fns';

type TestOptions = {
    destination: string;
    checkInDaysForward: number;
    stay: number;
};

for (const data of [
  { destination: 'Bariloche', checkInDaysForward: 14, stay: 10 },
  { destination: 'Mar de las Pampas', checkInDaysForward: 21, stay: 5 },
]) {
    const { destination, checkInDaysForward, stay } = data;
    test(`can book a hotel at ${destination}`, async ({page}) => {
        await page.goto('https://www.booking.com/');

        try {
            await page
                .locator('div:first-of-type > div:first-of-type > div:first-of-type > div:first-of-type > button')
                .click({timeout: 10000});
        } catch (exception) {
            // Do nothing.
        }

        const destinationInput = page.locator('[name="ss"]');
        await destinationInput.click();
        const clearDestinationButton = page.locator('[name="ss"] ~ div span[data-testid="input-clear"]');
        if (await clearDestinationButton.isVisible()) {
            await clearDestinationButton.click();
        }
        await destinationInput.fill(destination);
        const destinationOptions = page.locator('[data-testid="autocomplete-results"] li', {hasText: destination});
        await destinationOptions.nth(0).click({timeout: 3000});

        const today: Date = startOfToday();
        const checkIn: Date = addDays(today, checkInDaysForward);
        const checkOut: Date = addDays(checkIn, stay);
        const datePicker = page.locator('[data-testid="datepicker-tabs"]');
        const datesContainer = page.locator('[data-testid="searchbox-dates-container"]');
        if (await datePicker.isHidden()) {
            await datesContainer.click();
        }
        await page.locator(`[data-date="${formatISO(checkIn, {representation: 'date'})}"]`).click();
        await page.locator(`[data-date="${formatISO(checkOut, {representation: 'date'})}"]`).click();

        const submitButton = page.locator('[type="submit"]');
        await submitButton.isEnabled({timeout: 2000});
        await submitButton.click();

        await page.waitForLoadState('load');
        expect(await page.title()).toContain(destination);
    });
}