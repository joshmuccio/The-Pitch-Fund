/* src/lib/parseQuickPaste.ts */
import { getCode } from 'iso-3166-1-alpha-2';

const currency = (s: string) =>
  Number(s.replace(/[\$,]/g, '') || 0);

// Helper function to parse and format dates
const parseDate = (dateStr: string): string | null => {
  try {
    // Handle formats like "Jun 27, 2025" or "June 27, 2025"
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    // Convert to YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// Define all fields that could potentially be auto-populated
const AUTO_POPULATE_FIELDS = [
  'name',
  'slug', 
  'investment_date',
  'investment_amount',
  'instrument',
  'round_size_usd',
  'stage_at_investment',
  'conversion_cap_usd',
  'discount_percent',
  'post_money_valuation',
  'has_pro_rata_rights',
  'country_of_incorp',
  'incorporation_type',
  'reason_for_investing',
  'co_investors',
  'founder_name',
  'description_raw'
] as const;

export type AutoPopulateField = typeof AUTO_POPULATE_FIELDS[number];

export interface ParseResult {
  extractedData: Record<string, any>;
  successfullyParsed: Set<AutoPopulateField>;
  failedToParse: Set<AutoPopulateField>;
}

export function parseQuickPaste(raw: string): ParseResult {
  console.log('parseQuickPaste: Starting parse with text length:', raw.length);
  console.log('parseQuickPaste: First 300 chars:', raw.substring(0, 300));
  
  const out: Record<string, any> = {};
  const successfullyParsed = new Set<AutoPopulateField>();
  const failedToParse = new Set<AutoPopulateField>();

  const m = (label: RegExp) => {
    const match = raw.match(label);
    const result = match?.[1]?.trim();
    console.log(`parseQuickPaste: Regex ${label.source} -> ${result ? `"${result}"` : 'null'}`);
    return result;
  };

  // Extract company name from the title
  const companyMatch = raw.match(/Investment in (.+)/i);
  if (companyMatch) {
    out.name = companyMatch[1].trim();
    // Generate slug from company name
    out.slug = out.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    console.log('parseQuickPaste: Extracted company name:', out.name);
    console.log('parseQuickPaste: Generated slug:', out.slug);
    successfullyParsed.add('name');
    successfullyParsed.add('slug');
  } else {
    failedToParse.add('name');
    failedToParse.add('slug');
  }

  // Extract investment date from "Completed on [date]"
  const completedDateMatch = m(/Completed on\s+(.+?)\.?$/im);
  if (completedDateMatch) {
    const parsedDate = parseDate(completedDateMatch);
    if (parsedDate) {
      out.investment_date = parsedDate;
      console.log('parseQuickPaste: Extracted investment date:', out.investment_date);
      successfullyParsed.add('investment_date');
    } else {
      failedToParse.add('investment_date');
    }
  } else {
    failedToParse.add('investment_date');
  }

  // Investment Amount
  const investmentAmountMatch = m(/Investment Amount\s+\$?([\d,\.]+)/i);
  if (investmentAmountMatch) {
    out.investment_amount = currency(investmentAmountMatch);
    console.log('parseQuickPaste: Extracted investment amount:', out.investment_amount);
    successfullyParsed.add('investment_amount');
  } else {
    failedToParse.add('investment_amount');
  }

  // Investment Instrument
  const instr = m(/Investing in\s+(.+)/i);
  if (instr) {
    const instrLower = instr.toLowerCase();
    if (instrLower.includes('safe') && instrLower.includes('post')) {
      out.instrument = 'safe_post';
    } else if (instrLower.includes('safe') && instrLower.includes('pre')) {
      out.instrument = 'safe_pre';
    } else if (instrLower.includes('convertible') || instrLower.includes('note')) {
      out.instrument = 'convertible_note';
    } else if (instrLower.includes('equity')) {
      out.instrument = 'equity';
    } else {
      // Don't set a default - let the user choose explicitly
      failedToParse.add('instrument');
    }
    
    if (out.instrument) {
      console.log('parseQuickPaste: Extracted instrument:', out.instrument);
      successfullyParsed.add('instrument');
    }
  } else {
    failedToParse.add('instrument');
  }

  // Round Size
  const roundSizeMatch = m(/Round Size\s+\$?([\d,\.]+)/i);
  if (roundSizeMatch) {
    out.round_size_usd = currency(roundSizeMatch);
    console.log('parseQuickPaste: Extracted round size:', out.round_size_usd);
    successfullyParsed.add('round_size_usd');
  } else {
    failedToParse.add('round_size_usd');
  }

  // Round/Stage
  const round = m(/Round\s+(.+)/i);
  if (round) {
    const roundLower = round.toLowerCase().replace('-', '_');
    if (roundLower.includes('pre_seed') || roundLower.includes('preseed')) {
      out.stage_at_investment = 'pre_seed';
    } else if (roundLower.includes('seed')) {
      out.stage_at_investment = 'seed';
    } else if (roundLower.includes('series_a') || roundLower.includes('series a')) {
      out.stage_at_investment = 'series_a';
    } else if (roundLower.includes('series_b') || roundLower.includes('series b')) {
      out.stage_at_investment = 'series_b';
    }
    
    if (out.stage_at_investment) {
      console.log('parseQuickPaste: Extracted stage:', out.stage_at_investment);
      successfullyParsed.add('stage_at_investment');
    } else {
      console.log('parseQuickPaste: Found Round field but could not map to known stage:', round);
      failedToParse.add('stage_at_investment');
    }
  } else {
    failedToParse.add('stage_at_investment');
  }

  // SAFE/Note specific fields
  if (out.instrument && ['safe_post', 'safe_pre', 'convertible_note'].includes(out.instrument)) {
    console.log('parseQuickPaste: Processing SAFE/Note specific fields');
    const capMatch = m(/Conversion Cap\s+\$?([\d,\.]+)/i);
    if (capMatch) {
      out.conversion_cap_usd = currency(capMatch);
      console.log('parseQuickPaste: Extracted conversion cap:', out.conversion_cap_usd);
      successfullyParsed.add('conversion_cap_usd');
    } else {
      failedToParse.add('conversion_cap_usd');
    }
    
    const discountMatch = m(/Discount\s+([\d\.]+)%?/i);
    if (discountMatch) {
      out.discount_percent = Number(discountMatch);
      console.log('parseQuickPaste: Extracted discount:', out.discount_percent);
      successfullyParsed.add('discount_percent');
    } else {
      failedToParse.add('discount_percent');
    }
  }

  // Equity specific fields
  if (out.instrument === 'equity') {
    console.log('parseQuickPaste: Processing Equity specific fields');
    const postMoneyMatch = m(/Post-Money Valuation\s+\$?([\d,\.]+)/i);
    if (postMoneyMatch) {
      out.post_money_valuation = currency(postMoneyMatch);
      console.log('parseQuickPaste: Extracted post-money valuation:', out.post_money_valuation);
      successfullyParsed.add('post_money_valuation');
    } else {
      console.log('parseQuickPaste: Post-Money Valuation not found in text');
      failedToParse.add('post_money_valuation');
    }
  }

  // Pro-rata rights (improved regex to handle "Pro-rata rights included? Yes/No")
  const proRataMatch = /Pro-rata rights[^?]*\??\s*(Yes|No)/i.exec(raw);
  if (proRataMatch) {
    out.has_pro_rata_rights = proRataMatch[1].toLowerCase() === 'yes';
    console.log('parseQuickPaste: Extracted pro-rata rights:', out.has_pro_rata_rights);
    successfullyParsed.add('has_pro_rata_rights');
  } else {
    failedToParse.add('has_pro_rata_rights');
  }

  // Country of Incorporation
  const cty = m(/Country of Incorporation\s+(.+)/i);
  if (cty) {
    const iso = getCode(cty);
    if (iso) {
      out.country_of_incorp = iso;
      console.log('parseQuickPaste: Extracted country code:', out.country_of_incorp);
      successfullyParsed.add('country_of_incorp');
    } else {
      failedToParse.add('country_of_incorp');
    }
  } else {
    failedToParse.add('country_of_incorp');
  }

  // Incorporation Type
  const inc = m(/Type of Incorporation\s+(.+)/i);
  if (inc) {
    const incLower = inc.toLowerCase();
    if (/c\s*corporation/i.test(inc)) {
      out.incorporation_type = 'c_corp';
    } else if (/s\s*corporation/i.test(inc)) {
      out.incorporation_type = 's_corp';
    } else if (/llc/i.test(inc)) {
      out.incorporation_type = 'llc';
    } else if (/benefit|b[\s-]corp|pbc|public benefit/i.test(inc)) {
      out.incorporation_type = 'bcorp';
    } else if (/gmbh/i.test(inc)) {
      out.incorporation_type = 'gmbh';
    } else if (/ltd/i.test(inc)) {
      out.incorporation_type = 'ltd';
    } else if (/plc/i.test(inc)) {
      out.incorporation_type = 'plc';
    } else {
      out.incorporation_type = 'other';
    }
    console.log('parseQuickPaste: Extracted incorporation type:', out.incorporation_type);
    successfullyParsed.add('incorporation_type');
  } else {
    failedToParse.add('incorporation_type');
  }

  // Reason for Investing
  const reason = m(/Reason for Investing\s+([\s\S]+?)(?:\n\s*\n|\n[A-Z]|$)/i);
  if (reason) {
    out.reason_for_investing = reason.trim();
    console.log('parseQuickPaste: Extracted reason (first 100 chars):', out.reason_for_investing.substring(0, 100));
    successfullyParsed.add('reason_for_investing');
  } else {
    failedToParse.add('reason_for_investing');
  }

  // Co-Investors (convert to comma-separated string)
  const co = m(/Notable Co-Investors\s+([\s\S]+?)(?=\n\s*Reason for Investing|\n\s*Company Details|\n\s*\n|$)/i);
  if (co && co !== '—' && co.toLowerCase() !== 'none') {
    // Handle multi-line co-investors by cleaning up the text and filtering out abbreviations
    const cleanedCo = co
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filter out empty lines, abbreviations, and very short entries
        // Keep only lines that are likely full company names (4+ chars, contains spaces or "Capital", "Ventures", etc.)
        return line.length >= 4 && 
               (line.includes(' ') || 
                /capital|ventures|partners|fund|investments?|group|llc|corp/i.test(line));
      })
      .join(', ');
    
    if (cleanedCo.length > 0) {
      out.co_investors = cleanedCo;
      console.log('parseQuickPaste: Extracted co-investors:', out.co_investors);
      successfullyParsed.add('co_investors');
    } else {
      failedToParse.add('co_investors');
    }
  } else {
    failedToParse.add('co_investors');
  }

  // Founders
  const founders = m(/Founders\s+(.+)/i);
  if (founders) {
    // Take the first founder for the form
    const founderList = founders.split(',').map(f => f.trim());
    if (founderList.length > 0) {
      out.founder_name = founderList[0];
      console.log('parseQuickPaste: Extracted founder name:', out.founder_name);
      successfullyParsed.add('founder_name');
    } else {
      failedToParse.add('founder_name');
    }
  } else {
    failedToParse.add('founder_name');
  }

  // Company Description
  const desc = m(/Description\s+([\s\S]+?)(?:\n\s*\n|$)/i);
  if (desc) {
    out.description_raw = desc.trim();
    console.log('parseQuickPaste: Extracted description (first 100 chars):', out.description_raw.substring(0, 100));
    successfullyParsed.add('description_raw');
  } else {
    failedToParse.add('description_raw');
  }

  // Don't set any default for investment_date - this should be explicitly provided

  console.log('parseQuickPaste: Final extracted data:', out);
  console.log('parseQuickPaste: Successfully parsed fields:', Array.from(successfullyParsed));
  console.log('parseQuickPaste: Failed to parse fields:', Array.from(failedToParse));
  
  return {
    extractedData: out,
    successfullyParsed,
    failedToParse
  };
} 