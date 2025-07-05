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

export function parseQuickPaste(raw: string) {
  console.log('parseQuickPaste: Starting parse with text length:', raw.length);
  console.log('parseQuickPaste: First 300 chars:', raw.substring(0, 300));
  
  const out: Record<string, any> = {};

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
    console.log('parseQuickPaste: Extracted company name:', out.name);
  }

  // Extract investment date from "Completed on [date]"
  const completedDateMatch = m(/Completed on\s+(.+?)\.?$/im);
  if (completedDateMatch) {
    const parsedDate = parseDate(completedDateMatch);
    if (parsedDate) {
      out.investment_date = parsedDate;
      console.log('parseQuickPaste: Extracted investment date:', out.investment_date);
    }
  }

  // Investment Amount
  if (m(/Investment Amount\s+\$?([\d,\.]+)/i)) {
    out.investment_amount = currency(m(/Investment Amount\s+\$?([\d,\.]+)/i)!);
    console.log('parseQuickPaste: Extracted investment amount:', out.investment_amount);
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
      out.instrument = 'equity'; // default fallback
    }
    console.log('parseQuickPaste: Extracted instrument:', out.instrument);
  }

  // Round Size
  if (m(/Round Size\s+\$?([\d,\.]+)/i)) {
    out.round_size_usd = currency(m(/Round Size\s+\$?([\d,\.]+)/i)!);
    console.log('parseQuickPaste: Extracted round size:', out.round_size_usd);
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
    console.log('parseQuickPaste: Extracted stage:', out.stage_at_investment);
  }

  // SAFE/Note specific fields
  if (out.instrument && ['safe_post', 'safe_pre', 'convertible_note'].includes(out.instrument)) {
    console.log('parseQuickPaste: Processing SAFE/Note specific fields');
    const capMatch = m(/Conversion Cap\s+\$?([\d,\.]+)/i);
    if (capMatch) {
      out.conversion_cap_usd = currency(capMatch);
      console.log('parseQuickPaste: Extracted conversion cap:', out.conversion_cap_usd);
    }
    
    const discountMatch = m(/Discount\s+([\d\.]+)%?/i);
    if (discountMatch) {
      out.discount_percent = Number(discountMatch);
      console.log('parseQuickPaste: Extracted discount:', out.discount_percent);
    }
  }

  // Equity specific fields
  if (out.instrument === 'equity') {
    console.log('parseQuickPaste: Processing Equity specific fields');
    const postMoneyMatch = m(/Post-Money Valuation\s+\$?([\d,\.]+)/i);
    if (postMoneyMatch) {
      out.post_money_valuation = currency(postMoneyMatch);
      console.log('parseQuickPaste: Extracted post-money valuation:', out.post_money_valuation);
    } else {
      console.log('parseQuickPaste: Post-Money Valuation not found in text');
    }
  }

  // Pro-rata rights (improved regex to handle "Pro-rata rights included? Yes/No")
  const proRataMatch = /Pro-rata rights[^?]*\??\s*(Yes|No)/i.exec(raw);
  if (proRataMatch) {
    out.has_pro_rata_rights = proRataMatch[1].toLowerCase() === 'yes';
    console.log('parseQuickPaste: Extracted pro-rata rights:', out.has_pro_rata_rights);
  }

  // Country of Incorporation
  const cty = m(/Country of Incorporation\s+(.+)/i);
  if (cty) {
    const iso = getCode(cty);
    if (iso) {
      out.country_of_incorp = iso;
      console.log('parseQuickPaste: Extracted country code:', out.country_of_incorp);
    }
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
    } else if (/benefit|b[\s-]corp/i.test(inc)) {
      out.incorporation_type = 'bcorp';
    } else {
      out.incorporation_type = 'other';
    }
    console.log('parseQuickPaste: Extracted incorporation type:', out.incorporation_type);
  }

  // Reason for Investing
  const reason = m(/Reason for Investing\s+([\s\S]+?)(?:\n\s*\n|\n[A-Z]|$)/i);
  if (reason) {
    out.reason_for_investing = reason.trim();
    console.log('parseQuickPaste: Extracted reason (first 100 chars):', out.reason_for_investing.substring(0, 100));
  }

  // Co-Investors (convert to comma-separated string)
  const co = m(/Notable Co-Investors\s+([\s\S]+?)(?:\n\s*\n|\n[A-Z]|$)/i);
  if (co && co !== '—' && co.toLowerCase() !== 'none') {
    // Handle multi-line co-investors by cleaning up the text
    out.co_investors = co.replace(/\n/g, ', ').trim();
    console.log('parseQuickPaste: Extracted co-investors:', out.co_investors);
  }

  // Founders
  const founders = m(/Founders\s+(.+)/i);
  if (founders) {
    // Take the first founder for the form
    const founderList = founders.split(',').map(f => f.trim());
    if (founderList.length > 0) {
      out.founder_name = founderList[0];
      console.log('parseQuickPaste: Extracted founder name:', out.founder_name);
    }
  }

  // Company Description
  const desc = m(/Description\s+([\s\S]+?)(?:\n\s*\n|$)/i);
  if (desc) {
    out.description_raw = desc.trim();
    console.log('parseQuickPaste: Extracted description (first 100 chars):', out.description_raw.substring(0, 100));
  }

  // Only set today's date as investment date if no date was found
  if (!out.investment_date) {
    const today = new Date();
    out.investment_date = today.toISOString().split('T')[0];
    console.log('parseQuickPaste: Set default investment date:', out.investment_date);
  }

  console.log('parseQuickPaste: Final extracted data:', out);
  return out;
} 